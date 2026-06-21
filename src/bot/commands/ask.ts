import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  TextChannel,
  type Attachment,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { checkRateLimit } from "../../security/guard.js";
import { sessionManager } from "../../codex/session-manager.js";
import { L } from "../../utils/i18n.js";
import { buildAttachmentPromptSuffix, downloadAttachment, type DownloadedAttachment } from "../attachments.js";
import { getConfig } from "../../utils/config.js";
import { sanitizePublicText } from "../../utils/public-safety.js";

export const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription("Send a prompt to the Codex session registered to this channel")
  .addStringOption((opt) =>
    opt
      .setName("prompt")
      .setDescription("Prompt for local Codex")
      .setRequired(true),
  )
  .addAttachmentOption((opt) =>
    opt
      .setName("file")
      .setDescription("Optional image or file for Codex to inspect")
      .setRequired(false),
  )
  .addAttachmentOption((opt) =>
    opt
      .setName("file2")
      .setDescription("Optional second image or file for Codex")
      .setRequired(false),
  )
  .addAttachmentOption((opt) =>
    opt
      .setName("file3")
      .setDescription("Optional third image or file for Codex")
      .setRequired(false),
  );

function formatPromptForDiscord(prompt: string): string {
  const normalized = sanitizePublicText(prompt, 1_400).replace(/```/g, "'''");
  return normalized.length > 1_400 ? `${normalized.slice(0, 1_400)}...` : normalized;
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const project = getProject(interaction.channelId);
  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "Ez a csatorna nincs projekthez regisztrálva."),
    });
    return;
  }

  if (!checkRateLimit(interaction.user.id)) {
    await interaction.editReply({
      content: L("Rate limit exceeded. Please wait a moment.", "Túllépted a rate limitet. Várj egy kicsit, majd próbáld újra."),
    });
    return;
  }

  const prompt = interaction.options.getString("prompt", true).trim();
  if (!prompt) {
    await interaction.editReply({ content: L("Prompt is empty.", "A prompt üres.") });
    return;
  }

  if (!interaction.channel?.isTextBased() || interaction.channel.isDMBased()) {
    await interaction.editReply({ content: L("This command must be used in a server text channel.", "Ezt a parancsot szerver text csatornában kell használni.") });
    return;
  }

  let finalPrompt = prompt;
  const attachmentNotes: string[] = [];
  const downloadedAttachments: DownloadedAttachment[] = [];
  const attachments = ["file", "file2", "file3"]
    .map((name) => interaction.options.getAttachment(name, false))
    .filter((attachment): attachment is Attachment => Boolean(attachment));

  for (const attachment of attachments) {
    const result = await downloadAttachment(attachment as Attachment, project.project_path);
    if ("skipped" in result) {
      attachmentNotes.push(result.skipped);
    } else {
      downloadedAttachments.push(result);
      attachmentNotes.push(`Attachment saved for Codex: \`${result.safeName}\``);
    }
  }
  finalPrompt += buildAttachmentPromptSuffix(downloadedAttachments);

  if (sessionManager.isActive(interaction.channelId)) {
    if (sessionManager.hasQueue(interaction.channelId)) {
      await interaction.editReply({
        content: L("⏳ A message is already waiting to be queued. Please press the button first.", "⏳ Már van egy queue megerősítésre váró üzenet. Előbb nyomd meg a gombot."),
      });
      return;
    }
    if (sessionManager.isQueueFull(interaction.channelId)) {
      await interaction.editReply({
        content: L(`⏳ Queue is full (max ${getConfig().DISCORD_QUEUE_MAX_ITEMS}). Please wait for the current task to finish.`, `⏳ A queue megtelt (maximum ${getConfig().DISCORD_QUEUE_MAX_ITEMS}). Várd meg, amíg az aktuális feladat elkészül.`),
      });
      return;
    }

    sessionManager.setPendingQueue(interaction.channelId, interaction.channel as TextChannel, finalPrompt);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue-yes:${interaction.channelId}`)
        .setLabel(L("Add to Queue", "Queue-ba rakás"))
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId(`queue-no:${interaction.channelId}`)
        .setLabel(L("Cancel", "Mégse"))
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❌"),
    );

    await interaction.editReply({
      content: [
        L("⏳ A previous task is in progress. Process this automatically when done?", "⏳ Egy korábbi feladat még fut. Feldolgozzam automatikusan, ha kész?"),
        ...attachmentNotes,
      ].join("\n"),
      components: [row],
    });
    return;
  }

  await interaction.editReply({
    content: [
      L("Prompt sent to local Codex.", "A prompt elküldve a helyi Codexnek."),
      ...attachmentNotes,
      "```text",
      formatPromptForDiscord(prompt),
      "```",
    ].join("\n"),
  });
  await sessionManager.sendMessage(interaction.channel as TextChannel, finalPrompt);
}
