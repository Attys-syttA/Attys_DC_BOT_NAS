import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { sessionManager } from "../../codex/session-manager.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop the active Codex session in this channel");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "Ez a csatorna nincs projekthez regisztrálva."),
    });
    return;
  }

  const stopped = await sessionManager.stopSession(channelId);
  if (stopped) {
    await interaction.editReply({
      embeds: [
        {
          title: L("Session Stopped", "Session leállítva"),
          description: L(`Stopped Codex session for \`${sanitizePublicFileLabel(project.project_path)}\``, `\`${sanitizePublicFileLabel(project.project_path)}\` Codex session leállítva`),
          color: 0xff6600,
        },
      ],
    });
  } else {
    await interaction.editReply({
      content: L("No active session in this channel.", "Ebben a csatornában nincs aktív session."),
    });
  }
}
