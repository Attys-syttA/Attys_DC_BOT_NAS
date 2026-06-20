import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readOperatorEvents: vi.fn(),
  summarizeOperatorEvents: vi.fn(),
}));

vi.mock("../operator-events.js", () => ({
  readOperatorEvents: mocks.readOperatorEvents,
  summarizeOperatorEvents: mocks.summarizeOperatorEvents,
}));

import { buildEventsReply, execute } from "./events.js";

function makeInteraction(
  options: { limit?: number | null; kind?: string | null; summary?: boolean | null } = {},
) {
  return {
    options: {
      getInteger: vi.fn().mockReturnValue(options.limit ?? null),
      getString: vi.fn().mockReturnValue(options.kind ?? null),
      getBoolean: vi.fn().mockReturnValue(options.summary ?? null),
    },
    editReply: vi.fn(),
  };
}

describe("/events", () => {
  beforeEach(() => {
    mocks.summarizeOperatorEvents.mockReturnValue({
      total: 0,
      byKind: { startup: 0, lifecycle: 0, attention: 0, task: 0 },
      byStatus: {},
    });
  });

  it("builds a public-safe event reply", () => {
    const reply = buildEventsReply([
      "2026-06-20T18:40:00.000Z startup online",
      "2026-06-20T18:41:00.000Z task completed channel=<#123456789012345678>",
    ]);

    expect(reply).toContain("Attys DC BOT Events");
    expect(reply).toContain("startup online");
    expect(reply).not.toContain("token");
  });

  it("shows an empty-state reply", () => {
    expect(buildEventsReply([])).toContain("has no public-safe event lines yet");
  });

  it("can include a compact summary", () => {
    mocks.summarizeOperatorEvents.mockReturnValue({
      total: 2,
      byKind: { startup: 1, lifecycle: 0, attention: 0, task: 1 },
      byStatus: { online: 1, completed: 1 },
    });

    const reply = buildEventsReply([
      "2026-06-20T18:40:00.000Z startup online",
      "2026-06-20T18:41:00.000Z task completed",
    ], { kind: "task", summary: true });

    expect(reply).toContain("Attys DC BOT Events");
    expect(reply).toContain("(task)");
    expect(reply).toContain("summary: total:2 startup:1 task:1");
    expect(reply).toContain("statuses:");
  });

  it("reads the requested number of event lines", async () => {
    mocks.readOperatorEvents.mockReturnValue(["2026-06-20T18:40:00.000Z startup online"]);
    const interaction = makeInteraction({ limit: 5, kind: "task", summary: true });

    await execute(interaction as never);

    expect(mocks.readOperatorEvents).toHaveBeenCalledWith(expect.any(String), 5, "task");
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining("startup online"),
    });
  });
});
