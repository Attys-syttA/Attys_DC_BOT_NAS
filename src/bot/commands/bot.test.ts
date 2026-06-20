import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runLocalCommand: vi.fn(),
}));

vi.mock("./local-command.js", () => ({
  runLocalCommand: mocks.runLocalCommand,
  truncateOutput: (value: string) => value.trim() || "(no output)",
}));

import {
  botStatus,
  restartDisabledReply,
  restartScheduledReply,
  scheduleBotRestart,
} from "./bot.js";

describe("/bot helpers", () => {
  it("builds a public-safe launcher status reply", async () => {
    const platform = vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    try {
      mocks.runLocalCommand.mockResolvedValue({
        exitCode: 0,
        timedOut: false,
        output: "Running.\n",
      });

      await expect(botStatus("repo")).resolves.toContain("Running.");
      expect(mocks.runLocalCommand).toHaveBeenCalledWith("cmd", ["/c", "win-start.bat", "--status"], "repo", 15_000);
    } finally {
      platform.mockRestore();
    }
  });

  it("keeps restart gated behind an explicit env flag message", () => {
    expect(restartDisabledReply()).toContain("DISCORD_ENABLE_BOT_LIFECYCLE=true");
  });

  it("describes a scheduled restart without exposing local details", () => {
    const reply = restartScheduledReply();

    expect(reply).toContain("Restart scheduled");
    expect(reply).not.toContain(":\\");
  });

  it("does not schedule restart outside Windows", () => {
    const platform = vi.spyOn(process, "platform", "get").mockReturnValue("linux");

    expect(scheduleBotRestart("repo")).toBe(false);
    platform.mockRestore();
  });
});
