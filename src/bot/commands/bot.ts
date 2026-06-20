import { spawn } from "node:child_process";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getConfig } from "../../utils/config.js";
import { runLocalCommand, truncateOutput } from "./local-command.js";

type BotAction = "status" | "restart";

export const data = new SlashCommandBuilder()
  .setName("bot")
  .setDescription("Show or restart the local bot process")
  .addStringOption((option) => option
    .setName("action")
    .setDescription("Lifecycle action")
    .setRequired(true)
    .addChoices(
      { name: "status", value: "status" },
      { name: "restart", value: "restart" },
    ));

export async function botStatus(repoRoot: string): Promise<string> {
  const result = process.platform === "win32"
    ? await runLocalCommand("cmd", ["/c", "win-start.bat", "--status"], repoRoot, 15_000)
    : { exitCode: null, timedOut: false, output: "Windows launcher unavailable on this platform" };

  const status = result.exitCode === 0
    ? truncateOutput(result.output, 300)
    : "status unavailable";
  return `**Attys DC BOT Status**\n\`\`\`text\n${status}\n\`\`\``;
}

export function scheduleBotRestart(repoRoot: string): boolean {
  if (process.platform !== "win32") return false;
  const child = spawn("cmd.exe", [
    "/c",
    "start",
    "",
    "/min",
    "cmd.exe",
    "/c",
    "timeout /t 2 /nobreak >nul & win-start.bat",
  ], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return true;
}

export function restartDisabledReply(): string {
  return [
    "**Attys DC BOT Restart**",
    "`DISCORD_ENABLE_BOT_LIFECYCLE=true` is required before Discord can restart the local bot.",
  ].join("\n");
}

export function restartScheduledReply(): string {
  return [
    "**Attys DC BOT Restart**",
    "Restart scheduled. The bot may be unavailable for a few seconds.",
  ].join("\n");
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const action = interaction.options.getString("action", true) as BotAction;
  if (action === "status") {
    await interaction.editReply({ content: await botStatus(process.cwd()) });
    return;
  }

  const config = getConfig();
  if (!config.DISCORD_ENABLE_BOT_LIFECYCLE) {
    await interaction.editReply({ content: restartDisabledReply() });
    return;
  }

  const scheduled = scheduleBotRestart(process.cwd());
  await interaction.editReply({
    content: scheduled ? restartScheduledReply() : "**Attys DC BOT Restart**\nRestart is only available on Windows.",
  });
}
