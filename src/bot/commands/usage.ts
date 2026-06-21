import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { L } from "../../utils/i18n.js";
import { fetchCodexUsage, formatUsageCacheAge, getCodexUsageRows, getUsagePercentLeft, loadCodexUsageCache, type CodexUsageData } from "../../codex/usage.js";

export const data = new SlashCommandBuilder()
  .setName("usage")
  .setDescription("Show Codex usage from your local account");

function progressBar(percentLeft: number, width = 12): string {
  const filled = Math.round((percentLeft / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function formatResetText(
  resetsAt: number | undefined,
  now: Date,
): string {
  if (!resetsAt) return "";

  const resetDate = new Date(resetsAt * 1000);
  const sameDay =
    resetDate.getFullYear() === now.getFullYear() &&
    resetDate.getMonth() === now.getMonth() &&
    resetDate.getDate() === now.getDate();

  if (sameDay) {
    const formatted = resetDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return L(`Resets ${formatted}`, `${formatted} visszaáll`);
  }

  const formatted = resetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return L(`Resets on ${formatted}`, `${formatted} visszaáll`);
}

function usageLabel(windowDurationMins: number | undefined): string {
  if (windowDurationMins === 300) {
    return L("5-hour limit", "5 órás limit");
  }
  if (windowDurationMins === 10080) {
    return L("7-day limit", "7 napos limit");
  }
  if (windowDurationMins) {
    return L(`${windowDurationMins}-minute limit`, `${windowDurationMins} perces limit`);
  }
  return L("Usage limit", "Használati limit");
}

function footerText(fetchedAt: number | null, now = Date.now()): string {
  const suffix = "chatgpt.com/codex/settings/usage";
  if (!fetchedAt) return suffix;

  return `${formatUsageCacheAge(fetchedAt, now)}  ·  ${suffix}`;
}

function describeUsage(usage: CodexUsageData): string {
  const rows = getCodexUsageRows(usage);
  const now = new Date();
  const lines: string[] = [];

  for (const row of rows) {
    if (row.bucketTitle) {
      lines.push(`**${row.bucketTitle}**`);
    }

    const percentLeft = getUsagePercentLeft(row.window);
    const reset = formatResetText(row.window.resetsAt, now);
    lines.push(
      `**${usageLabel(row.window.windowDurationMins)}**  \`${progressBar(percentLeft)}\`  **${percentLeft}% ${L("left", "maradt")}**${reset ? `  ·  ${reset}` : ""}`,
    );
  }

  if (usage.planType) {
    lines.unshift(`**${L("Plan", "Csomag")}**: \`${usage.planType}\``);
  }

  return lines.join("\n\n");
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  let usage: CodexUsageData | null = null;
  let fetchedAt: number | null = null;

  try {
    usage = await fetchCodexUsage();
    if (usage) {
      fetchedAt = Date.now();
    }
  } catch {
    // fall back to cache below
  }

  if (!usage) {
    const cached = loadCodexUsageCache();
    usage = cached?.usage ?? null;
    fetchedAt = cached?.fetchedAt ?? null;
  }

  if (!usage || getCodexUsageRows(usage).length === 0) {
    await interaction.editReply({
      content: L(
        "Codex usage unavailable: app-server did not return usable data and the local cache is missing or unreadable. Check `codex login status`, then try Refresh Usage again.",
        "Nem sikerült lekérni a Codex használati adatokat. Nincs használható app-server válasz vagy helyi cache. Ellenőrizd a `codex login status` eredményét, majd próbáld újra.",
      ),
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(L("📊 Codex Usage", "📊 Codex használat"))
    .setDescription(describeUsage(usage))
    .setColor(0x10b981)
    .setFooter({ text: footerText(fetchedAt) })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
