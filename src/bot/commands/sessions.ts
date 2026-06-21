import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { getProject, getSession, upsertSession } from "../../db/database.js";
import { listStoredThreads } from "../../codex/storage.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";

interface SessionInfo {
  sessionId: string;
  preview: string;
  timestamp: string;
  source: string;
}

interface SessionFilterOptions {
  query?: string | null;
  source?: string | null;
  limit?: number;
}

export function findSessionDir(projectPath: string): string | null {
  const first = listStoredThreads(projectPath)[0];
  return first?.rollout_path ? path.dirname(first.rollout_path) : null;
}

export async function getLastAssistantMessage(filePath: string): Promise<string> {
  const full = await getLastAssistantMessageFull(filePath);
  if (full === "(no message)") return full;
  const lines = full.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines[lines.length - 1] || full.slice(-200);
}

export async function getLastAssistantMessageFull(filePath: string): Promise<string> {
  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lastText = "";

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === "response_item" && entry.payload?.type === "message") {
        const content = entry.payload?.content ?? [];
        const text = Array.isArray(content)
          ? content
              .map((item: { text?: string }) => item?.text ?? "")
              .join("")
              .trim()
          : "";
        if (text) lastText = text;
      }

      if (entry.type === "item_completed" && entry.item?.type === "agentMessage" && typeof entry.item.text === "string") {
        const text = entry.item.text.trim();
        if (text) lastText = text;
      }
    } catch {
      // skip malformed lines
    }
  }

  rl.close();
  stream.destroy();
  return lastText || "(no message)";
}

export async function listSessions(projectPath: string): Promise<SessionInfo[]> {
  return listStoredThreads(projectPath).map((thread) => ({
    sessionId: thread.id,
    preview: thread.title || "(empty session)",
    timestamp: new Date(thread.updated_at * 1000).toISOString(),
    source: thread.source,
  }));
}

export function filterSessions(
  sessions: SessionInfo[],
  options: SessionFilterOptions = {},
): SessionInfo[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const source = options.source?.trim().toLowerCase() ?? "all";
  const limit = Math.max(1, Math.min(24, options.limit ?? 24));

  return sessions
    .filter((session) => source === "all" || session.source.toLowerCase() === source)
    .filter((session) => {
      if (!query) return true;
      return [
        session.preview,
        session.sessionId,
        session.source,
      ].some((value) => value.toLowerCase().includes(query));
    })
    .slice(0, limit);
}

export const data = new SlashCommandBuilder()
  .setName("sessions")
  .setDescription("List and resume existing Codex sessions for this project")
  .addStringOption((option) => option
    .setName("query")
    .setDescription("Filter sessions by title, source, or id")
    .setRequired(false))
  .addStringOption((option) => option
    .setName("source")
    .setDescription("Filter by session source")
    .setRequired(false)
    .addChoices(
      { name: "all", value: "all" },
      { name: "vscode", value: "vscode" },
      { name: "codex", value: "codex" },
      { name: "discord", value: "discord" },
    ))
  .addIntegerOption((option) => option
    .setName("limit")
    .setDescription("Maximum sessions to show")
    .setMinValue(1)
    .setMaxValue(24)
    .setRequired(false));

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project. Use `/register` first.", "Ez a csatorna nincs projekthez regisztrálva. Előbb használd a `/register` parancsot."),
    });
    return;
  }

  const allSessions = await listSessions(project.project_path);
  const query = interaction.options.getString("query", false);
  const source = interaction.options.getString("source", false) ?? "all";
  const limit = interaction.options.getInteger("limit", false) ?? 24;
  const sessions = filterSessions(allSessions, { query, source, limit });

  if (allSessions.length === 0) {
    const { randomUUID } = await import("node:crypto");
    upsertSession(randomUUID(), channelId, null, "idle");
    const projectLabel = sanitizePublicFileLabel(project.project_path);
    await interaction.editReply({
      embeds: [
        {
          title: L("✨ New Session", "✨ Új session"),
          description: L(
            `No existing Codex sessions found for \`${projectLabel}\`.\nA new session is ready — your next message will start a new conversation.`,
            `A(z) \`${projectLabel}\` projekthez nincs meglévő Codex session.\nAz új session készen áll - a következő üzenettől új beszélgetés indul.`
          ),
          color: 0x00ff00,
        },
      ],
    });
    return;
  }

  if (sessions.length === 0) {
    await interaction.editReply({
      content: L("No Codex sessions matched that filter.", "Nincs a szűrőnek megfelelő Codex session."),
    });
    return;
  }

  const dbSession = getSession(channelId);
  const activeSessionId = dbSession?.session_id ?? null;

  const options: Array<{ label: string; description: string; value: string; default?: boolean }> = [
    {
      label: L("✨ Create New Session", "✨ Új session létrehozása"),
      description: L("Start a new conversation without an existing session", "Új beszélgetés indítása meglévő session nélkül"),
      value: "__new_session__",
    },
  ];

  for (const session of sessions) {
    const preview = session.preview.length > 70 ? session.preview.slice(0, 70) + "…" : session.preview;
    const date = new Date(session.timestamp).toLocaleString();
    options.push({
      label: preview || "(empty session)",
      description: `${session.source} • ${date}`,
      value: session.sessionId,
      ...(activeSessionId === session.sessionId ? { default: true } : {}),
    });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("session-select")
    .setPlaceholder(L("Select a session to inspect or resume", "Válassz sessiont megtekintéshez vagy folytatáshoz"))
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({
    embeds: [
      {
        title: L("Codex Sessions", "Codex Session"),
        description: L(
          `Project: \`${sanitizePublicFileLabel(project.project_path)}\`\nChoose a session to view its last response, resume it, or delete it.`,
          `Projekt: \`${sanitizePublicFileLabel(project.project_path)}\`\nVálassz sessiont az utolsó válasz megtekintéséhez, folytatáshoz vagy törléshez.`
        ),
        footer: {
          text: `Showing ${sessions.length} of ${allSessions.length} sessions`,
        },
        color: 0x5865f2,
      },
    ],
    components: [row],
  });
}
