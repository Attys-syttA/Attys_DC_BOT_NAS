import { describe, expect, it } from "vitest";
import { summarizeRegisteredCommandNames } from "./command-surface.js";

describe("command surface registration summaries", () => {
  it("reports exact command registration parity", () => {
    expect(summarizeRegisteredCommandNames(["ask", "status"], ["ask", "status"])).toEqual([
      "OK slash command registration 2/2",
    ]);
  });

  it("reports missing and extra slash commands without ids or paths", () => {
    const lines = summarizeRegisteredCommandNames(["ask", "legacy"], ["ask", "status", "health"]);

    expect(lines).toEqual([
      "INFO slash command registration 2/3",
      "FAIL missing slash commands: /health, /status",
      "INFO extra slash commands: /legacy",
    ]);
    expect(lines.join("\n")).not.toContain(":\\");
  });
});
