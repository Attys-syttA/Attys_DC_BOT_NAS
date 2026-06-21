import { Message, TextChannel, Attachment, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getProject } from "../../db/database.js";
import { isAllowedPrincipal, checkRateLimit } from "../../security/guard.js";
import { sessionManager } from "../../codex/session-manager.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";
import { buildAttachmentPromptSuffix, downloadAttachment, safeAttachmentFileName } from "../attachments.js";

function messageRoleIds(message: Message): string[] {
  return message.member ? [...message.member.roles.cache.keys()] : [];
}

export { safeAttachmentFileName };

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;

  const project = getProject(message.channelId);
  if (!project) return;

  const config = getConfig();
  const text = message.content.trim();
  const hasAttachments = message.attachments.size > 0;
  const hasPendingCustomInput = sessionManager.hasPendingCustomInput(message.channelId);
  const shouldHandlePrompt =
    (config.DISCORD_ENABLE_MESSAGE_PROMPTS && Boolean(text)) ||
    (hasAttachments && (config.DISCORD_ENABLE_MESSAGE_PROMPTS || config.DISCORD_ENABLE_ATTACHMENT_MESSAGES));

  if (!hasPendingCustomInput && !shouldHandlePrompt) return;

  if (!isAllowedPrincipal(message.author.id, messageRoleIds(message))) {
    await message.reply(L("You are not authorized to use this bot.", "Nincs jogosultságod a bot használatához."));
    return;
  }

  if (!checkRateLimit(message.author.id)) {
    await message.reply(L("Rate limit exceeded. Please wait a moment.", "Túllépted a rate limitet. Várj egy kicsit, majd próbáld újra."));
    return;
  }

  if (hasPendingCustomInput) {
    if (text) {
      sessionManager.resolveCustomInput(message.channelId, text);
      await message.react("✅");
    }
    return;
  }

  if (hasAttachments && !text) {
    await message.reply(L(
      "I can see an attachment, but I need an instruction too. Use `Apps` -> `Send to Codex` on this message, or send `/ask prompt:` with file fields.",
      "Látom a csatolt fájlt, de utasítás is kell hozzá. Használd ezen az üzeneten az `Apps` -> `Send to Codex` műveletet, vagy küldj `/ask prompt:` parancsot a file mezővel.",
    ));
    return;
  }

  let prompt = text;
  const downloadedAttachments: Array<{ filePath: string; isImage: boolean; safeName: string }> = [];
  const skippedMessages: string[] = [];

  for (const [, attachment] of message.attachments) {
    const result = await downloadAttachment(attachment as Attachment, project.project_path);
    if ("skipped" in result) {
      skippedMessages.push(result.skipped);
      continue;
    }
    downloadedAttachments.push(result);
  }

  if (skippedMessages.length > 0) {
    await message.reply(skippedMessages.join("\n"));
  }

  prompt += buildAttachmentPromptSuffix(downloadedAttachments);

  if (!prompt) return;

  const channel = message.channel as TextChannel;

  if (sessionManager.isActive(message.channelId)) {
    if (sessionManager.hasQueue(message.channelId)) {
      await message.reply(L("⏳ A message is already waiting to be queued. Please press the button first.", "⏳ Már van egy queue megerősítésre váró üzenet. Előbb nyomd meg a gombot."));
      return;
    }
    if (sessionManager.isQueueFull(message.channelId)) {
      const maxQueueItems = getConfig().DISCORD_QUEUE_MAX_ITEMS;
      await message.reply(L(`⏳ Queue is full (max ${maxQueueItems}). Please wait for the current task to finish.`, `⏳ A queue megtelt (maximum ${maxQueueItems}). Várd meg, amíg az aktuális feladat elkészül.`));
      return;
    }

    sessionManager.setPendingQueue(message.channelId, channel, prompt);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue-yes:${message.channelId}`)
        .setLabel(L("Add to Queue", "Queue-ba rakás"))
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId(`queue-no:${message.channelId}`)
        .setLabel(L("Cancel", "Mégse"))
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❌"),
    );

    await message.reply({
      content: L("⏳ A previous task is in progress. Process this automatically when done?", "⏳ Egy korábbi feladat még fut. Feldolgozzam automatikusan, ha kész?"),
      components: [row],
    });
    return;
  }

  await sessionManager.sendMessage(channel, prompt);
}
