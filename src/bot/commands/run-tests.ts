import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";
import { npmCommand, runLocalCommand, truncateOutput } from "./local-command.js";

export const data = new SlashCommandBuilder()
  .setName("run-tests")
  .setDescription("Run npm test in the project registered to this channel");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const config = getConfig();
  if (!config.DISCORD_ENABLE_RUN_TESTS) {
    await interaction.editReply({
      content: L("`/run-tests` is disabled. Set `DISCORD_ENABLE_RUN_TESTS=true` in `.env` to enable it.", "A `/run-tests` ki van kapcsolva."),
    });
    return;
  }

  const project = getProject(interaction.channelId);
  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "Ez a csatorna nincs projekthez regisztrálva."),
    });
    return;
  }

  await interaction.editReply({ content: L("Running `npm test` locally...", "Helyben futtatom: `npm test`...") });
  const result = await runLocalCommand(npmCommand(), ["test"], project.project_path, 120_000);
  const title = result.timedOut
    ? "npm test timed out"
    : result.exitCode === 0
      ? "npm test passed"
      : `npm test failed (${result.exitCode ?? "error"})`;

  await interaction.followUp({
    content: `**${title}**\n\`\`\`text\n${truncateOutput(result.output)}\n\`\`\``,
  });
}
