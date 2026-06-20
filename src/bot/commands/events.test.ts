import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readOperatorEvents: vi.fn(),
}));

vi.mock("../operator-events.js", () => ({
  readOperatorEvents: mocks.readOperatorEvents,
}));

import { buildEventsReply, execute } from "./events.js";

function makeInteraction(limit: number | null = null) {
  return {
    options: {
      getInteger: vi.fn().mockReturnValue(limit),
    },
    editReply: vi.fn(),
  };
}

describe("/events", () => {
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

  it("reads the requested number of event lines", async () => {
    mocks.readOperatorEvents.mockReturnValue(["2026-06-20T18:40:00.000Z startup online"]);
    const interaction = makeInteraction(5);

    await execute(interaction as never);

    expect(mocks.readOperatorEvents).toHaveBeenCalledWith(expect.any(String), 5);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining("startup online"),
    });
  });
});
