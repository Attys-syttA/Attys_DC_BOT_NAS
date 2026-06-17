import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getProject: vi.fn(),
  unregisterProject: vi.fn(),
  stopSession: vi.fn(),
}));

vi.mock("../../db/database.js", () => ({
  getProject: mocks.getProject,
  unregisterProject: mocks.unregisterProject,
}));

vi.mock("../../codex/session-manager.js", () => ({
  sessionManager: {
    stopSession: mocks.stopSession,
  },
}));

import { execute } from "./unregister.js";

function makeInteraction(selectedChannelId?: string) {
  return {
    channelId: "current-channel",
    options: {
      getChannel: vi.fn().mockReturnValue(selectedChannelId ? { id: selectedChannelId } : null),
    },
    editReply: vi.fn(),
  };
}

describe("/unregister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProject.mockReturnValue({
      channel_id: "current-channel",
      project_path: "/projects/app",
    });
  });

  it("unregisters the current channel by default", async () => {
    const interaction = makeInteraction();

    await execute(interaction as never);

    expect(mocks.stopSession).toHaveBeenCalledWith("current-channel");
    expect(mocks.unregisterProject).toHaveBeenCalledWith("current-channel");
    expect(interaction.editReply.mock.calls[0][0].embeds[0].description).toContain("<#current-channel>");
  });

  it("unregisters a selected legacy channel mapping", async () => {
    const interaction = makeInteraction("legacy-channel");

    await execute(interaction as never);

    expect(mocks.getProject).toHaveBeenCalledWith("legacy-channel");
    expect(mocks.stopSession).toHaveBeenCalledWith("legacy-channel");
    expect(mocks.unregisterProject).toHaveBeenCalledWith("legacy-channel");
    expect(interaction.editReply.mock.calls[0][0].embeds[0].description).toContain("<#legacy-channel>");
  });

  it("reports an unregistered selected channel", async () => {
    mocks.getProject.mockReturnValue(undefined);
    const interaction = makeInteraction("legacy-channel");

    await execute(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "The selected channel is not registered to any project.",
    });
    expect(mocks.unregisterProject).not.toHaveBeenCalled();
  });
});
