# External platform acceptance after Windows prerelease

Status: active

## Elkeszult reszek

- Windows/P1 release-readiness was completed and split to `docs/codex-tasks/plans/done/windows-release-readiness-after-source-parity.md`.
- Cross-platform implementation is locally complete for source parity: Linux/macOS launchers, Linux Python tray/control panel source, macOS Swift menu bar source, canonical usage cache handling, cross-platform safe update CLI, and public-safe platform docs/assets are present.
- Debian WSL2 acceptance is already proven for headless Linux build/test/check, Codex CLI login status, live bot smoke, `/ask` Codex response, and WSLg Tk control panel render/status/usage/Stop/Restart.
- macOS compile-only evidence is covered by the `macOS Swift Compile` GitHub Actions workflow.
- The upstream-like normal message workflow is documented as explicit opt-in only. Safe default remains slash/context-command control.
- First Windows prerelease is published as `v0.1.00001-pre`.

## Nyitott reszek

- **Linux desktop runtime acceptance:** verify the Linux tray icon in a real Linux desktop session with tray support. WSL2/WSLg control panel evidence is useful, but it is not enough for tray icon acceptance.
- **macOS runtime acceptance:** verify the Swift menu bar app on a real or remote Mac. GitHub Actions compile-only evidence is not runtime acceptance.
- **iPad/mobile Discord smoke:** verify file upload -> `Send to Codex` -> modal prompt -> Codex response -> `/last` from a real mobile Discord client.
- **Optional Discord response policy polish:** consider a separate consistency pass for `DISCORD_EPHEMERAL_RESPONSES`; keep it outside release-readiness and platform acceptance unless it becomes necessary.

## Szigoru vegrehajtasi szabaly

- Do not claim Linux tray icon runtime acceptance without a real Linux desktop session with tray support.
- Do not claim macOS menu bar runtime acceptance without a real or remote Mac runtime smoke.
- Do not claim iPad/mobile file handoff acceptance without a live mobile Discord client smoke.
- Do not make normal Discord messages into default Codex prompts. Keep `DISCORD_ENABLE_MESSAGE_PROMPTS=false` as the default.
- Keep normal text+attachment prompt mode behind `DISCORD_ENABLE_ATTACHMENT_MESSAGES=true`.
- Do not add new platform features in this plan unless an acceptance smoke proves an existing implementation cannot work.
- Do not expose tokens, raw Discord IDs, private local paths, Codex auth state, `.env` values, logs, or runtime SQLite state in docs, screenshots, test output, or Discord output.

## Kovetkezo vegrehajtasi szeletek

1. **Linux tray icon smoke**
   - Prepare a real Linux desktop session with tray support.
   - Start the bot with the Linux launcher.
   - Start the Linux tray app.
   - Verify tray icon appears, opens the control panel, reports status, and can run Start/Stop/Restart without exposing local private data.
   - Record exact distro, desktop/session type, Node version, and result.

2. **macOS menu bar runtime smoke**
   - Prepare a real or remote Mac with command line tools.
   - Build/run `menubar/CodexBotMenu.swift`.
   - Verify menu bar item appears, reports bot status, opens log/folder/setup links, and can start/stop/restart through `mac-start.sh`.
   - Record macOS version, Swift/Xcode command line tools version, and result.

3. **iPad/mobile file handoff smoke**
   - Use a live Discord mobile client.
   - Upload a file in the registered operator channel.
   - Choose `Send to Codex`.
   - Fill the modal prompt.
   - Verify Codex receives the saved-file prompt suffix and returns a response.
   - Verify `/last` retrieves the response.

4. **Final platform acceptance update**
   - Update this plan with exact evidence.
   - Update `docs/STATE.md` and `docs/CHANGELOG.dev.md`.
   - Run `npm run plans:check`, `npm run check`, `git diff --check`, and `ggshield secret scan path --recursive --yes --use-gitignore .` after any tracked change.

## Definition of Done

- Linux tray icon runtime smoke has real Linux desktop evidence, or remains explicitly pending.
- macOS menu bar runtime smoke has real Mac evidence, or remains explicitly pending.
- iPad/mobile file handoff has real mobile Discord evidence, or remains explicitly pending.
- No platform is described as production/runtime accepted without real target-platform evidence.
- Any future release notes distinguish Windows-supported baseline from external-platform future-work.
