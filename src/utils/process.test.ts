import { describe, expect, it } from "vitest";
import { windowsCmdInvocation } from "./process.js";

describe("windowsCmdInvocation", () => {
  it("wraps Windows cmd scripts without using shell mode", () => {
    const invocation = windowsCmdInvocation("codex.cmd", ["app-server"]);

    if (process.platform === "win32") {
      expect(invocation).toEqual({
        command: "cmd.exe",
        args: ["/d", "/s", "/c", "\"codex.cmd\" \"app-server\""],
      });
    } else {
      expect(invocation).toEqual({
        command: "codex.cmd",
        args: ["app-server"],
      });
    }
  });
});
