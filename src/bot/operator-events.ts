import fs from "node:fs";
import path from "node:path";

export type OperatorEventKind = "startup" | "attention" | "task" | "lifecycle";

export interface OperatorEventInput {
  kind: OperatorEventKind;
  status: string;
  channelId?: string;
}

const EVENT_LINE_PATTERN = /^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z (startup|attention|task|lifecycle) [a-z0-9-]+(?: channel=(?:<#\d{5,30}>|project-channel))?$/;

function eventLogPath(repoRoot = process.cwd()): string {
  return path.join(repoRoot, "operator-events.log");
}

function safeToken(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 48) || "unknown";
}

function safeChannel(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^\d{5,30}$/.test(trimmed) ? `<#${trimmed}>` : "project-channel";
}

export function formatOperatorEvent(
  input: OperatorEventInput,
  now = new Date(),
): string {
  const base = [
    now.toISOString(),
    input.kind,
    safeToken(input.status),
  ].join(" ");
  const channel = safeChannel(input.channelId);
  return channel ? `${base} channel=${channel}` : base;
}

export function recordOperatorEvent(input: OperatorEventInput, repoRoot = process.cwd()): void {
  try {
    fs.appendFileSync(eventLogPath(repoRoot), `${formatOperatorEvent(input)}\n`, "utf8");
  } catch {
    // Operator event logging is diagnostic only.
  }
}

export function readOperatorEvents(repoRoot = process.cwd(), maxLines = 10): string[] {
  try {
    const lines = fs.readFileSync(eventLogPath(repoRoot), "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => EVENT_LINE_PATTERN.test(line));
    return lines.slice(-Math.max(1, Math.min(25, maxLines)));
  } catch {
    return [];
  }
}
