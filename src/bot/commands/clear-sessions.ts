import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { deleteStoredThread, listStoredThreads } from "../../codex/storage.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";

export const data = new SlashCommandBuilder()
  .setName("clear-sessions")
  .setDescription("Delete all Codex session files for this project")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!getConfig().DISCORD_ENABLE_SESSION_DELETE) {
    await interaction.editReply({
      content: L(
        "`/clear-sessions` is disabled. Set `DISCORD_ENABLE_SESSION_DELETE=true` in `.env` to enable it.",
        "A `/clear-sessions` ki van kapcsolva.",
      ),
    });
    return;
  }

  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project. Use `/register` first.", "Ez a csatorna nincs projekthez regisztrálva. Előbb használd a `/register` parancsot."),
    });
    return;
  }

  const threads = listStoredThreads(project.project_path);
  if (threads.length === 0) {
    await interaction.editReply({
      content: L("No session files to delete.", "Nincs törölhető session fájl."),
    });
    return;
  }

  let deleted = 0;
  for (const thread of threads) {
    if (deleteStoredThread(thread.id)) deleted++;
  }

  await interaction.editReply({
    embeds: [
      {
        title: L("Sessions Cleared", "Sessionök törölve"),
        description: [
          `Project: \`${sanitizePublicFileLabel(project.project_path)}\``,
          L(`Deleted **${deleted}** session(s)`, `**${deleted}** session törölve`),
        ].join("\n"),
        color: 0xff6b6b,
      },
    ],
  });
}
