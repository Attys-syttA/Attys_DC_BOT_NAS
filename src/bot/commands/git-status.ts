import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { L } from "../../utils/i18n.js";
import { runLocalCommand, truncateOutput } from "./local-command.js";

export const data = new SlashCommandBuilder()
  .setName("git-status")
  .setDescription("Show git status for the project registered to this channel");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const project = getProject(interaction.channelId);
  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "이 채널은 어떤 프로젝트에도 등록되어 있지 않습니다."),
    });
    return;
  }

  const result = await runLocalCommand("git", ["status", "--short", "--branch"], project.project_path, 10_000);
  const title = result.timedOut
    ? "git status timed out"
    : result.exitCode === 0
      ? "git status"
      : `git status failed (${result.exitCode ?? "error"})`;

  await interaction.editReply({
    content: `**${title}**\n\`\`\`text\n${truncateOutput(result.output)}\n\`\`\``,
  });
}
