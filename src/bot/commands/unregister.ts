import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { unregisterProject, getProject } from "../../db/database.js";
import { sessionManager } from "../../codex/session-manager.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";
import { recordOperatorEvent } from "../operator-events.js";

export const data = new SlashCommandBuilder()
  .setName("unregister")
  .setDescription("Unregister a channel from its project")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Optional registered channel to unregister; defaults to the current channel")
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const selectedChannel = interaction.options.getChannel("channel", false);
  const channelId = selectedChannel?.id ?? interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: selectedChannel
        ? L("The selected channel is not registered to any project.", "A kiválasztott csatorna nincs projekthez regisztrálva.")
        : L("This channel is not registered to any project.", "Ez a csatorna nincs projekthez regisztrálva."),
    });
    return;
  }

  await sessionManager.stopSession(channelId);
  unregisterProject(channelId);
  recordOperatorEvent({ kind: "lifecycle", status: "mapping-remove", channelId });

  await interaction.editReply({
    embeds: [
        {
          title: L("Project Unregistered", "Projekt regisztráció törölve"),
          description: L(`Removed <#${channelId}> link to \`${sanitizePublicFileLabel(project.project_path)}\``, `<#${channelId}> kapcsolata törölve: \`${sanitizePublicFileLabel(project.project_path)}\``),
          color: 0xff0000,
      },
    ],
  });
}
