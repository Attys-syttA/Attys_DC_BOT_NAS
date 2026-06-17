import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  runLocalCommand: vi.fn(),
}));

vi.mock("../../db/database.js", () => ({
  getProject: mocks.getProject,
}));

vi.mock("./local-command.js", () => ({
  runLocalCommand: mocks.runLocalCommand,
  truncateOutput: (output: string) => output.trim() || "(no output)",
}));

import { execute } from "./git-status.js";

function makeInteraction() {
  return {
    channelId: "channel-1",
    editReply: vi.fn(),
  };
}

describe("/git-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProject.mockReturnValue({ channel_id: "channel-1", project_path: "/projects/app" });
    mocks.runLocalCommand.mockResolvedValue({
      exitCode: 0,
      timedOut: false,
      output: "## main...origin/main\n",
    });
  });

  it("rejects unregistered channels", async () => {
    mocks.getProject.mockReturnValue(undefined);
    const interaction = makeInteraction();

    await execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "This channel is not registered to any project.",
    });
    expect(mocks.runLocalCommand).not.toHaveBeenCalled();
  });

  it("runs git status in the registered project", async () => {
    const interaction = makeInteraction();

    await execute(interaction as never);

    expect(mocks.runLocalCommand).toHaveBeenCalledWith(
      "git",
      ["status", "--short", "--branch"],
      "/projects/app",
      10_000,
    );
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "**git status**\n```text\n## main...origin/main\n```",
    });
  });

  it("reports timeout without leaking command environment details", async () => {
    mocks.runLocalCommand.mockResolvedValue({
      exitCode: null,
      timedOut: true,
      output: "",
    });
    const interaction = makeInteraction();

    await execute(interaction as never);

    expect(interaction.editReply.mock.calls[0][0].content).toContain("git status timed out");
  });
});
