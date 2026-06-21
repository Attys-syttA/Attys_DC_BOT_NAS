import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { sessionManager } from "../../codex/session-manager.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicText } from "../../utils/public-safety.js";

export const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("View and manage queued messages in this channel")
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Show all queued messages")
  )
  .addSubcommand((sub) =>
    sub.setName("clear").setDescription("Clear all queued messages")
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove one queued message by its list number")
      .addIntegerOption((opt) =>
        opt
          .setName("number")
          .setDescription("Queue item number from /queue list")
          .setRequired(true)
          .setMinValue(1),
      )
  );

function queuePreview(prompt: string): string {
  return sanitizePublicText(prompt, 100) || "(empty prompt)";
}

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

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "list") {
    const queue = sessionManager.getQueue(channelId);
    if (queue.length === 0) {
      await interaction.editReply({
        content: L("No messages in queue.", "Nincs üzenet a queue-ban."),
      });
      return;
    }

    const list = queue
      .map((item, idx) => {
        const preview = queuePreview(item.prompt);
        return `**${idx + 1}.** ${preview}`;
      })
      .join("\n\n");

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const itemButtons: ButtonBuilder[] = queue.map((_, idx) =>
      new ButtonBuilder()
        .setCustomId(`queue-remove:${channelId}:${idx}`)
        .setLabel(`❌ ${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const clearButton = new ButtonBuilder()
      .setCustomId(`queue-clear:${channelId}`)
      .setLabel(L("Clear All", "Összes törlése"))
      .setStyle(ButtonStyle.Danger);

    const allButtons = [...itemButtons.slice(0, 19), clearButton];
    for (let i = 0; i < allButtons.length; i += 5) {
      const chunk = allButtons.slice(i, i + 5);
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...chunk));
    }

    await interaction.editReply({
      embeds: [
        {
          title: L(`📋 Message Queue (${queue.length})`, `📋 Üzenet queue (${queue.length})`),
          description: list,
          color: 0x5865f2,
        },
      ],
      components: rows,
    });
    return;
  }

  if (subcommand === "remove") {
    const itemNumber = interaction.options.getInteger("number", true);
    const removed = sessionManager.removeFromQueue(channelId, itemNumber - 1);
    if (!removed) {
      await interaction.editReply({
        content: L("No queued message exists with that number.", "Nincs ilyen sorszámú queue elem."),
      });
      return;
    }

    const preview = queuePreview(removed);
    await interaction.editReply({
      embeds: [
        {
          title: L("Queue Item Removed", "Queue elem eltávolítva"),
          description: L(`Removed item ${itemNumber}:\n> ${preview}`, `${itemNumber}. elem eltávolítva:\n> ${preview}`),
          color: 0xff6600,
        },
      ],
    });
    return;
  }

  const cleared = sessionManager.clearQueue(channelId);
  await interaction.editReply({
    embeds: [
      {
        title: L("Queue Cleared", "Queue törölve"),
        description: L(`Cleared ${cleared} queued message(s).`, `${cleared} függő üzenet törölve.`),
        color: 0xff6600,
      },
    ],
  });
}
