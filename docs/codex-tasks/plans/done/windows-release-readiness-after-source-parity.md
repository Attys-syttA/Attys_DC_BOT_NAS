# Windows release-readiness after source parity

Status: done

## Elkeszult reszek

- Source baseline reviewed: `chadingTV/codex-discord` `main` at `dc1afb8e81077fc3e0cbac02c13c69a27d573b8b` remained the fixed comparison point for the release-readiness closeout.
- Source gap audit completed in `docs/SOURCE_GAP_AUDIT.md`: no P1 bot-core implementation gap remained against the source repo.
- Source parity matrix completed in `docs/SOURCE_PARITY_MATRIX.md`: upstream command areas, Codex app-server/session handling, SQLite mapping, attachment safety, queue, approval, usage, and platform launcher capabilities were either implemented, implemented differently for Attys safety, or explicitly deferred.
- Windows baseline implemented: `install.bat`, `win-start.bat`, Windows tray/control panel, settings editor, local logs, usage display, update readiness, `Safe Update`, login startup toggle, and operator tools preflight are present.
- Discord operator surface implemented beyond source: `/ask`, `Send to Codex`, `/dashboard`, `/doctor`, `/health`, `/events`, `/logs`, `/mappings`, `/tools`, `/bot`, `/sessions`, `/last`, `/usage`, approvals, user-input questions, queue visibility, and public-safe diagnostics.
- Safety defaults stayed unchanged: `DISCORD_ENABLE_MESSAGE_PROMPTS=false`, `DISCORD_ENABLE_ATTACHMENT_MESSAGES=false`, `DISCORD_ENABLE_AUTO_APPROVE=false`, `DISCORD_ENABLE_SESSION_DELETE=false`, and `DISCORD_ENABLE_BOT_LIFECYCLE=false`.
- Windows onboarding polish completed in README/SETUP, including the Windows-first path, acceptance checklist link, tray button reference, and first-run troubleshooting route.
- 2026-06-22 local validation passed: `npm run typecheck`, `npm test` (`38` files, `248` tests), `npm run build`, `npm run check`, `git diff --check`, and `ggshield secret scan path --recursive --yes --use-gitignore .`.
- 2026-06-22 Windows launcher lifecycle smoke passed: `win-start.bat --stop`, `--status`, start, `--status`, `--stop`, final `--status`, and `npm run doctor:local`; final launcher state was `Stopped`.
- 2026-06-22 operator tools preflight ran through the Windows launcher and completed OK for own MCP, Docker Desktop, and Obsidian MCP without starting VS Code or the Telegram/NAS worker.
- 2026-06-22 Windows tray/control panel interactive acceptance was operator-tested with no errors reported: the lifecycle/status panel opened, the listed buttons were tried, closing the window minimized it to the system tray, and it could be reopened from the tray.
- 2026-06-22 Discord live smoke was operator-tested with no errors reported: `/doctor`, `/health`, `/dashboard`, `/register`, `/ask`, `Send to Codex`, approval accept/deny, Codex question answer, `/events`, `/logs`, `/last`, `/sessions`, `/usage`, and `/bot status`.
- 2026-06-22 first GitHub prerelease published: `v0.1.00001-pre` at `https://github.com/Attys-syttA/Attys_DC_BOT/releases/tag/v0.1.00001-pre`.
- 2026-06-22 post-release Dependabot follow-up completed: `@types/node` updated to `26.0.0`, `actions/checkout` updated to `7`, and TypeScript updated to `6.0.3` with `tsconfig.json` compatibility for `tsup` DTS generation.
- GitHub Actions passed on `main` after the prerelease and after the dependency follow-up: CI, SQLite Check, Secret Scan, and macOS Swift Compile.

## Nyitott reszek

- None for Windows/P1 release-readiness.
- External-platform acceptance was split into `docs/codex-tasks/plans/pending/active/external-platform-acceptance.md`.

## Szigoru vegrehajtasi szabaly

- Do not retroactively mark Linux tray icon runtime, macOS menu bar runtime, or iPad/mobile acceptance complete without real target-platform evidence.
- Do not make the `chadingTV/codex-discord` normal-message-first UX the default in a future release.
- Keep normal message prompts and normal text+attachment prompts behind explicit env opt-in and Discord Message Content Intent guidance.
- Do not commit `.env`, runtime SQLite state, logs, Codex auth state, raw Discord IDs, tokens, private hostnames/IPs, or private local paths.

## Definition of Done

- Windows acceptance checklist recorded with exact date and result.
- Discord live smoke recorded with exact command coverage.
- Validation commands green, including secret scan.
- First prerelease created after commit/push and green GitHub Actions.
- Remaining platform work split into its own active plan.
