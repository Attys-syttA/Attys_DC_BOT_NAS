import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { registerProject, getProject } from "../../db/database.js";
import { validateProjectPath } from "../../security/guard.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";
import { sanitizePublicFileLabel } from "../../utils/public-safety.js";
import { listProjectAutocompleteChoices } from "./register-paths.js";

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription("Register this channel to a project directory")
  .addStringOption((opt) =>
    opt
      .setName("path")
      .setDescription("Project folder name under BASE_PROJECT_DIR")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const input = interaction.options.getString("path", true);
  const config = getConfig();
  // If input is absolute path, use as-is; otherwise join with base dir
  const projectPath = path.isAbsolute(input)
    ? input
    : path.join(config.BASE_PROJECT_DIR, input);
  const channelId = interaction.channelId;
  const guildId = interaction.guildId!;

  // Check if already registered
  const existing = getProject(channelId);
  if (existing) {
    const existingLabel = sanitizePublicFileLabel(existing.project_path);
    await interaction.editReply({
      content: L(`This channel is already registered to \`${existingLabel}\`. Use \`/unregister\` first.`, `Ez a csatorna már \`${existingLabel}\` projekthez van regisztrálva. Előbb használd az \`/unregister\` parancsot.`),
    });
    return;
  }

  // Create directory if it doesn't exist (new project)
  if (!fs.existsSync(projectPath)) {
    const resolved = path.resolve(projectPath);
    const baseDir = path.resolve(config.BASE_PROJECT_DIR);
    if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
      await interaction.editReply({ content: L(`Invalid path: Path must be within ${sanitizePublicFileLabel(baseDir)}`, `Érvénytelen útvonal: ${sanitizePublicFileLabel(baseDir)} alatt kell lennie`) });
      return;
    }
    if (projectPath.includes("..")) {
      await interaction.editReply({ content: L("Invalid path: Path must not contain '..'", "Érvénytelen útvonal: '..'nem tartalmazhatja") });
      return;
    }
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Validate path
  const error = validateProjectPath(projectPath);
  if (error) {
    await interaction.editReply({ content: L(`Invalid path: ${error}`, `Érvénytelen útvonal: ${error}`) });
    return;
  }

  registerProject(channelId, projectPath, guildId);
  const projectLabel = sanitizePublicFileLabel(projectPath);

  await interaction.editReply({
    embeds: [
      {
        title: L("Project Registered", "Projekt regisztrálva"),
        description: L(`This channel is now linked to:\n\`${projectLabel}\``, `Ez a csatorna ehhez kapcsolódik:\n\`${projectLabel}\``),
        color: 0x00ff00,
        fields: [
          { name: L("Status", "Állapot"), value: L("🔴 Offline", "🔴 Offline"), inline: true },
          { name: L("Auto-approve", "Auto-jóváhagyás"), value: L("Off", "Ki"), inline: true },
        ],
      },
    ],
  });
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused();
  const config = getConfig();

  try {
    await interaction.respond(listProjectAutocompleteChoices(config.BASE_PROJECT_DIR, focused));
  } catch {
    await interaction.respond([]);
  }
}
