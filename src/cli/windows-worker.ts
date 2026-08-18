import "dotenv/config";
import { initDatabase } from "../db/database.js";
import {
  buildWindowsWorkerStatusSnapshot,
  defaultWindowsWorkerId,
  formatWindowsWorkerStatus,
  recordWindowsWorkerStatus,
  runWindowsWorkerOnce,
} from "../botops/windows-worker.js";

function print(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<void> {
  initDatabase();

  const mode = process.argv[2] ?? "--once";
  const workerId = process.env.BOTOPS_WINDOWS_WORKER_ID || defaultWindowsWorkerId();
  const repoRoot = process.cwd();

  if (mode === "--status") {
    const snapshot = buildWindowsWorkerStatusSnapshot(repoRoot, workerId);
    recordWindowsWorkerStatus(snapshot, "status", "manual status check");
    print(formatWindowsWorkerStatus(snapshot));
    return;
  }

  if (mode === "--once") {
    const result = runWindowsWorkerOnce(repoRoot, workerId);
    print(`status=${result.status}`);
    print(result.result);
    return;
  }

  print("Usage: tsx src/cli/windows-worker.ts --status|--once");
  process.exitCode = 1;
}

main().catch((error) => {
  print(error instanceof Error ? error.message : "Windows worker failed");
  process.exitCode = 1;
});
