import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { createOrGetBotOpsJob, listBotOpsWorkerHeartbeats } from "../../db/database.js";
import { formatBotOpsJobDetails, formatBotOpsWorkerHeartbeats } from "../../botops/render.js";

export const data = new SlashCommandBuilder()
  .setName("nas")
  .setDescription("Inspect or queue fixed NAS control-plane tasks")
  .addSubcommand((subcommand) => subcommand
    .setName("status")
    .setDescription("Show NAS control-plane status"))
  .addSubcommand((subcommand) => subcommand
    .setName("worker-status")
    .setDescription("Queue a fixed NAS worker health check"));

export function buildNasStatusReply(): string {
  const heartbeats = listBotOpsWorkerHeartbeats("nas");
  return [
    "**NAS control plane**",
    "```text",
    "mode: queue/status/result broker",
    "fixed NAS tasks: enabled",
    "NAS source write: disabled",
    "container deploy/rebuild: disabled without separate approval gate",
    "",
    formatBotOpsWorkerHeartbeats(heartbeats),
    "```",
  ].join("\n");
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const action = interaction.options.getSubcommand();
  if (action === "status") {
    await interaction.editReply({ content: buildNasStatusReply() });
    return;
  }

  const { job, created } = createOrGetBotOpsJob({
    requested_by: interaction.user.id,
    target: "nas",
    capability: "nas.worker.check",
    summary: "NAS fixed worker health check",
  });

  await interaction.editReply({
    content: [
      created ? "**NAS worker check queued**" : "**NAS worker check already exists**",
      "```text",
      formatBotOpsJobDetails(job),
      "```",
      "No NAS shell or deploy action was executed directly from Discord.",
    ].join("\n"),
  });
}
