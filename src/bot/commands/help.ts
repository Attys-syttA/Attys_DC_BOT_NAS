import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { commandChoices, renderHelpDetail, renderHelpList } from "./help-renderer.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Magyar sugo a bot parancsaihoz")
  .addStringOption((opt) =>
    opt
      .setName("parancs")
      .setDescription("Melyik parancsrol kersz reszletesebb sugot?")
      .setRequired(false)
      .setAutocomplete(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused();
  await interaction.respond(commandChoices(String(focused)));
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const selected = interaction.options.getString("parancs", false);
  await interaction.editReply({
    content: selected ? renderHelpDetail(selected) : renderHelpList(interaction.commandName),
  });
}
