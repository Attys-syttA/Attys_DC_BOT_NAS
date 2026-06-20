import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import {
  OperatorEventKind,
  readOperatorEvents,
  summarizeOperatorEvents,
} from "../operator-events.js";

type EventKindOption = OperatorEventKind | "all";

export const data = new SlashCommandBuilder()
  .setName("events")
  .setDescription("Show recent public-safe operator events")
  .addIntegerOption((option) => option
    .setName("limit")
    .setDescription("Number of events to show")
    .setMinValue(1)
    .setMaxValue(25))
  .addStringOption((option) => option
    .setName("kind")
    .setDescription("Filter events by type")
    .addChoices(
      { name: "all", value: "all" },
      { name: "startup", value: "startup" },
      { name: "lifecycle", value: "lifecycle" },
      { name: "attention", value: "attention" },
      { name: "task", value: "task" },
    ))
  .addBooleanOption((option) => option
    .setName("summary")
    .setDescription("Include a compact event summary"));

function formatSummary(lines: string[]): string {
  const summary = summarizeOperatorEvents(lines);
  const kinds = Object.entries(summary.byKind)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}:${count}`)
    .join(" ");
  const statuses = Object.entries(summary.byStatus)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([status, count]) => `${status}:${count}`)
    .join(" ");

  return [
    `summary: total:${summary.total}${kinds ? ` ${kinds}` : ""}`,
    statuses ? `statuses: ${statuses}` : "statuses: none",
  ].join("\n");
}

export function buildEventsReply(
  lines: string[],
  options: { kind?: EventKindOption; summary?: boolean } = {},
): string {
  const kind = options.kind ?? "all";
  return [
    `**Attys DC BOT Events** (${kind})`,
    options.summary ? formatSummary(lines) : null,
    lines.length > 0
      ? `\`\`\`text\n${lines.join("\n")}\n\`\`\``
      : "`operator-events.log` has no public-safe event lines yet.",
  ].filter(Boolean).join("\n");
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const limit = interaction.options.getInteger("limit") ?? 10;
  const kind = (interaction.options.getString("kind") ?? "all") as EventKindOption;
  const summary = interaction.options.getBoolean("summary") ?? false;
  await interaction.editReply({
    content: buildEventsReply(readOperatorEvents(process.cwd(), limit, kind), { kind, summary }),
  });
}
