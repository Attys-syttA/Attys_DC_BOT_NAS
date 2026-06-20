import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

vi.mock("../../codex/storage.js", () => ({
  listStoredThreads: vi.fn(),
}));

import { listStoredThreads } from "../../codex/storage.js";
import {
  filterSessions,
  findSessionDir,
  getLastAssistantMessage,
  getLastAssistantMessageFull,
  listSessions,
} from "./sessions.js";

describe("sessions helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findSessionDir returns the parent directory of the first rollout file", () => {
    vi.mocked(listStoredThreads).mockReturnValue([
      {
        id: "thread-1",
        rollout_path: "/tmp/codex/2026/03/rollout-1.jsonl",
        created_at: 1,
        updated_at: 2,
        source: "vscode",
        model_provider: "openai",
        cwd: "/project",
        title: "Hello",
      },
    ]);

    expect(findSessionDir("/project")).toBe("/tmp/codex/2026/03");
  });

  it("findSessionDir returns null when no stored threads exist", () => {
    vi.mocked(listStoredThreads).mockReturnValue([]);
    expect(findSessionDir("/project")).toBeNull();
  });

  it("getLastAssistantMessageFull reads Codex agentMessage entries", async () => {
    const filePath = path.join(os.tmpdir(), `codex-session-${Date.now()}.jsonl`);
    fs.writeFileSync(
      filePath,
      [
        JSON.stringify({ type: "item_completed", item: { type: "agentMessage", text: "First" } }),
        JSON.stringify({ type: "item_completed", item: { type: "agentMessage", text: "Line 1\nLine 2" } }),
      ].join("\n"),
    );

    const result = await getLastAssistantMessageFull(filePath);
    expect(result).toBe("Line 1\nLine 2");
  });

  it("getLastAssistantMessage returns the last line of the last message", async () => {
    const filePath = path.join(os.tmpdir(), `codex-session-last-${Date.now()}.jsonl`);
    fs.writeFileSync(
      filePath,
      [
        JSON.stringify({ type: "item_completed", item: { type: "agentMessage", text: "Part A" } }),
        JSON.stringify({ type: "item_completed", item: { type: "agentMessage", text: "Part B\nTail" } }),
      ].join("\n"),
    );

    const result = await getLastAssistantMessage(filePath);
    expect(result).toBe("Tail");
  });

  it("listSessions maps stored threads into session summaries", async () => {
    vi.mocked(listStoredThreads).mockReturnValue([
      {
        id: "thread-1",
        rollout_path: "/tmp/rollout-1.jsonl",
        created_at: 1,
        updated_at: 1700000000,
        source: "vscode",
        model_provider: "openai",
        cwd: "/project",
        title: "Analyze repo",
      },
    ]);

    const result = await listSessions("/project");
    expect(result).toEqual([
      {
        sessionId: "thread-1",
        preview: "Analyze repo",
        timestamp: new Date(1700000000 * 1000).toISOString(),
        source: "vscode",
      },
    ]);
  });

  it("filters sessions by query, source, and limit", () => {
    const sessions = [
      {
        sessionId: "thread-alpha",
        preview: "Analyze repo",
        timestamp: "2026-06-20T10:00:00.000Z",
        source: "vscode",
      },
      {
        sessionId: "thread-beta",
        preview: "Fix Discord bot",
        timestamp: "2026-06-20T11:00:00.000Z",
        source: "discord",
      },
      {
        sessionId: "thread-gamma",
        preview: "Write docs",
        timestamp: "2026-06-20T12:00:00.000Z",
        source: "vscode",
      },
    ];

    expect(filterSessions(sessions, { query: "bot" }).map((session) => session.sessionId)).toEqual(["thread-beta"]);
    expect(filterSessions(sessions, { source: "vscode" }).map((session) => session.sessionId)).toEqual(["thread-alpha", "thread-gamma"]);
    expect(filterSessions(sessions, { limit: 2 })).toHaveLength(2);
  });
});
