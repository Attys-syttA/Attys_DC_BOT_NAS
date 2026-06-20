import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { readOperatorEvents } from "../operator-events.js";

export const data = new SlashCommandBuilder()
  .setName("events")
  .setDescription("Show recent public-safe operator events")
  .addIntegerOption((option) => option
    .setName("limit")
    .setDescription("Number of events to show")
    .setMinValue(1)
    .setMaxValue(25));

export function buildEventsReply(lines: string[]): string {
  return [
    "**Attys DC BOT Events**",
    lines.length > 0
      ? `\`\`\`text\n${lines.join("\n")}\n\`\`\``
      : "`operator-events.log` has no public-safe event lines yet.",
  ].join("\n");
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const limit = interaction.options.getInteger("limit") ?? 10;
  await interaction.editReply({
    content: buildEventsReply(readOperatorEvents(process.cwd(), limit)),
  });
}
