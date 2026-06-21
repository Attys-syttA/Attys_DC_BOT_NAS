import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { randomUUID } from "node:crypto";
import { getProject, getSession, upsertSession } from "../../db/database.js";
import { sessionManager } from "../../codex/session-manager.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";
import { recordOperatorEvent } from "../operator-events.js";

export const data = new SlashCommandBuilder()
  .setName("session")
  .setDescription("Inspect or control the Codex session for this channel")
  .addSubcommand((sub) =>
    sub.setName("current").setDescription("Show the currently selected Codex session")
  )
  .addSubcommand((sub) =>
    sub.setName("new").setDescription("Start a fresh Codex session on the next prompt")
  )
  .addSubcommand((sub) =>
    sub.setName("stop").setDescription("Stop the active Codex turn in this channel")
  );

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

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "current") {
    const session = getSession(channelId);
    await interaction.editReply({
      embeds: [
        {
          title: L("Current Session", "Aktuális session"),
          description: [
            `${L("Project", "Projekt")}: \`${sanitizePublicFileLabel(project.project_path)}\``,
            `${L("Thread", "Thread")}: ${session?.session_id ? `\`${session.session_id}\`` : L("new session on next prompt", "új session a következő promptnál")}`,
            `${L("Status", "Állapot")}: **${session?.status ?? "offline"}**`,
            `${L("Active turn", "Aktív feladat")}: **${sessionManager.isActive(channelId) ? "yes" : "no"}**`,
            `${L("Last activity", "Utolsó aktivitás")}: ${session?.last_activity ?? "never"}`,
          ].join("\n"),
          color: 0x5865f2,
        },
      ],
    });
    return;
  }

  if (subcommand === "new") {
    upsertSession(randomUUID(), channelId, null, "idle");
    recordOperatorEvent({ kind: "lifecycle", status: "session-new", channelId });
    await interaction.editReply({
      embeds: [
        {
          title: L("New Session Ready", "Új session kész"),
          description: L(
            "The next prompt in this channel will start a fresh local Codex thread.",
            "A csatorna következő promptja új helyi Codex threadet indít.",
          ),
          color: 0x10b981,
        },
      ],
    });
    return;
  }

  const stopped = await sessionManager.stopSession(channelId);
  await interaction.editReply({
    content: stopped
      ? L("Stopped the active Codex turn.", "Az aktív Codex feladat leállítva.")
      : L("No active Codex turn is running in this channel.", "Ebben a csatornában nem fut aktív Codex feladat."),
  });
}
