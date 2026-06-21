import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject, setAutoApprove } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

export const data = new SlashCommandBuilder()
  .setName("auto-approve")
  .setDescription("Toggle auto-approve mode for tool use in this channel")
  .addStringOption((opt) =>
    opt
      .setName("mode")
      .setDescription("on or off")
      .setRequired(true)
      .addChoices(
        { name: "on", value: "on" },
        { name: "off", value: "off" },
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const mode = interaction.options.getString("mode", true);
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "Ez a csatorna nincs projekthez regisztrálva."),
    });
    return;
  }

  const enabled = mode === "on";
  if (enabled && !getConfig().DISCORD_ENABLE_AUTO_APPROVE) {
    await interaction.editReply({
      content: L(
        "`auto-approve` is disabled. Set `DISCORD_ENABLE_AUTO_APPROVE=true` in `.env` to enable it.",
        "Az `auto-approve` ki van kapcsolva.",
      ),
    });
    return;
  }

  setAutoApprove(channelId, enabled);

  await interaction.editReply({
    embeds: [
      {
        title: L(`Auto-approve: ${enabled ? "ON" : "OFF"}`, `Auto-jóváhagyás: ${enabled ? "ON" : "OFF"}`),
        description: enabled
          ? L("Codex will automatically approve command and file-change requests in this channel", "A Codex automatikusan jóváhagyja ennek a csatornának a parancs- és fájlmódosítási kéréseit")
          : L("Codex will ask for approval before command or file changes", "A Codex jóváhagyást kér parancsok vagy fájlmódosítások előtt"),
        color: enabled ? 0x00ff00 : 0xff6600,
      },
    ],
  });
}
