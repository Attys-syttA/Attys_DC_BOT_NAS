import { spawn } from "node:child_process";
import { windowsCmdInvocation } from "../../utils/process.js";

export interface LocalCommandResult {
  exitCode: number | null;
  timedOut: boolean;
  output: string;
}

export function runLocalCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<LocalCommandResult> {
  return new Promise((resolve) => {
    const invocation = windowsCmdInvocation(command, args);
    const child = spawn(invocation.command, invocation.args, {
      cwd,
      windowsHide: true,
    });

    let output = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({
        exitCode: null,
        timedOut: false,
        output: error.message,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: code,
        timedOut,
        output,
      });
    });
  });
}

export function truncateOutput(output: string, maxLength = 1800): string {
  const normalized = output.trim() || "(no output)";
  if (normalized.length <= maxLength) return normalized;
  return `...${normalized.slice(normalized.length - maxLength)}`;
}

export function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}
