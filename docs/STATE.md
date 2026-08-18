# Project State

## Current Status

- Date: 2026-08-18
- Repository folder: `<CODEX_WORKS>\Attys_DC_BOT_NAS`
- Target remote: `https://github.com/Attys-syttA/Attys_DC_BOT_NAS`
- Phase: superseded/reference after source-of-truth correction
- Package version: `0.1.1-prerelease.9`
- Active plan: `docs/codex-tasks/plans/pending/active/botops-nas-windows-control-plane.md`

## Current Goal

Keep this repository as historical/reference material. Active Discord BotOps, NAS handoff/control-plane helpers, and limited worker execution are consolidated into `<CODEX_WORKS>\Attys_DC_BOT`.

## 2026-08-18 Direction Correction

- User clarified that `Attys_DC_BOT` is the intended primary repository and this NAS repository came from an older, weaker-NAS experiment.
- The same-day worker-target-root and restart-smoke work here is superseded as reference material.
- Useful fixed-worker ideas are being moved into `Attys_DC_BOT`; this repository must not become a second active BotOps runtime.
- The untracked `docs/codex-tasks/plans/pending/not-started/GPT_beszelgetes_uj_tervrol.md` file is user-owned local material and was not touched.

## Current Safety Model

- Default autonomy: staged approval.
- NAS role: queue, state, heartbeat, result store, and fixed allowlisted worker checks.
- Windows role: limited fixed helper requests, not arbitrary shell.
- Explicit approval remains required for source writes, repair apply, commit, push, deploy, cleanup, service restart, NAS-side write, and container rebuild.
- Unknown capabilities fail closed and must not fall back to shell execution.

## Completed In This Slice

- Reframed the repo-local policy from local Windows bot copy to NAS BotOps control-plane scope.
- Added the canonical BotOps capability, job, approval, target, and lease contract.
- Added SQLite-backed BotOps job storage with idempotent `job_id` handling.
- Added `/ops status|jobs|approve|cancel|logs` for staged job visibility and approval recording.
- Added `/nas status|worker-status` for NAS control-plane visibility and fixed worker-check job creation.
- Added `/windows status|helper-run` for limited Windows execution-plane visibility and fixed helper job creation.
- Added regression tests for capability allowlisting, approval matching, lease expiry, idempotent job creation, approval gating, and cancellation audit trail.
- Added the first NAS worker execution slice:
  - lease-based pickup for requested NAS jobs
  - heartbeat update
  - fixed `nas.worker.check` executor
  - public-safe result writing
  - `worker:nas:status`, `worker:nas:once`, and `worker:nas:loop` scripts
- Added the first Windows fixed helper worker slice:
  - fixed helper registry for `status.read`, `audit.check`, and approval-gated `service.restart`
  - worktree dirty preflight
  - bot lock inspection without stopping processes
  - config presence check without printing values
  - `audit.check` runs only the fixed `npm run check` helper and blocks on dirty or missing config
  - `service.restart` runs only the fixed `cmd /c win-start.bat` helper after an exact fresh approval and blocks on dirty worktree, missing config, stale/unknown bot lock, or missing helper script
- Added approval expiry hardening:
  - approvals record `approved_by` and `approval_expires_at`
  - default approval TTL is 15 minutes
  - worker pickup marks expired approved jobs as `stale` and returns them to `WaitingApproval`
  - stale approvals are not executed
- Added BotOps event audit trail:
  - `botops_events` records `job.created`, approval, status, and worker lifecycle events
  - `/ops logs` shows recent public-safe event history for a job
  - event recording is additive and does not start, approve, or execute any job by itself
- Added worker heartbeat visibility:
  - `botops_worker_heartbeats` stores the latest public-safe heartbeat per worker id
  - NAS and Windows worker status/once paths record fixed-capability worker status
  - `/nas status` and `/windows status` show the latest known heartbeat rows
  - no worker loop, service install, background launch, or restart was started
- Added the first approved worker lifecycle supervisor slice:
  - `worker:nas:start|stop|restart|supervisor-status`
  - `worker:windows:start|stop|restart|supervisor-status`
  - Windows worker gained an explicit `--loop` mode to match the NAS worker
  - the supervisor records separate PID and stdout/stderr log files under ignored runtime state
  - duplicate start is idempotent and reports the existing PID instead of launching another loop
  - restart waits for the previous PID to exit and fails closed if it is still running
  - no service install, OS autostart, source write, job approval, deploy, commit, push, or cleanup is performed automatically
- Added explicit Windows worker target-root wiring:
  - `BOTOPS_WINDOWS_TARGET_REPO_ROOT` may point the Windows worker at a separate live bot repository
  - the target root must be an absolute existing directory, otherwise the worker fails closed before running a helper
  - `DISCORD_DATABASE_PATH` can select the BotOps database but no longer counts as bot runtime config by itself
  - live restart smoke can now target the live `Attys_DC_BOT` repo while the worker code remains in this NAS repo
- Live `service.restart` smoke completed:
  - synthetic approved BotOps job `job-d61e9ed3-85d2-4c60-9f90-d2c6cc7e0d01` was created in the live bot database
  - worker ran from this NAS repo with `DISCORD_DATABASE_PATH` targeting the live bot DB and `BOTOPS_WINDOWS_TARGET_REPO_ROOT` targeting the live bot repo
  - result was `Completed`; the live bot PID changed from `44748` to `10440`
  - live bot status returned `Running`, `bot.err.log` stayed empty, and startup log recorded `Registered 29 application commands`

## Open Work

1. Do not continue active runtime implementation here.
2. Use this repository only as reference while consolidating useful pieces into `Attys_DC_BOT`.
3. Keep any future NAS write/deploy/rebuild/service work approval-gated in the source-of-truth repo.

## Latest Validation

- `npm test -- --run src/botops/contract.test.ts src/db/database.test.ts`: passed, 2 files / 22 tests.
- `npm run typecheck`: passed.
- `npm run check`: passed, 39 test files / 259 tests, build included.
- `git diff --check`: passed.
- `ggshield secret scan path --recursive --yes --use-gitignore .`: passed.
- `npm test -- --run src/botops/nas-worker.test.ts src/db/database.test.ts src/botops/contract.test.ts`: passed, 3 files / 29 tests.
- `npm run worker:nas:status`: passed; reported only `nas.worker.check` capability and no queued/running/waiting jobs.
- `npm test -- --run src/botops/windows-worker.test.ts src/db/database.test.ts src/botops/contract.test.ts`: passed, 3 files / 32 tests.
- `npm run worker:windows:status`: passed; reported `status.read, audit.check`, dirty worktree, free bot lock, and missing config without exposing values.
- `npm test -- --run src/db/database.test.ts src/botops/contract.test.ts src/botops/nas-worker.test.ts src/botops/windows-worker.test.ts`: passed, 4 files / 39 tests.
- `npm test -- --run src/db/database.test.ts src/botops/contract.test.ts src/botops/nas-worker.test.ts src/botops/windows-worker.test.ts`: passed, 4 files / 39 tests after event audit trail.
- `npm run typecheck`: passed after event audit trail.
- `npm run worker:nas:status`: passed; queued/running/waiting approval jobs all `0`.
- `npm run worker:windows:status`: passed; reported `status.read, audit.check`, dirty worktree, free bot lock, and missing config without exposing values.
- `npm run check`: passed, 41 test files / 276 tests, build included.
- `git diff --check`: passed.
- `ggshield secret scan path --recursive --yes --use-gitignore .`: passed.
- `npm test -- --run src/db/database.test.ts src/botops/nas-worker.test.ts src/botops/windows-worker.test.ts`: passed, 3 files / 36 tests after worker heartbeat visibility.
- `npm run typecheck`: passed after worker heartbeat visibility.
- `npm run worker:nas:status`: passed at `0.1.1-prerelease.6`; queued/running/waiting approval jobs all `0`.
- `npm run worker:windows:status`: passed at `0.1.1-prerelease.6`; reported `status.read, audit.check`, dirty worktree, free bot lock, and missing config without exposing values.
- `npm run check`: passed at `0.1.1-prerelease.6`, 41 test files / 279 tests, build included.
- `git diff --check`: passed at `0.1.1-prerelease.6`.
- `ggshield secret scan path --recursive --yes --use-gitignore .`: passed at `0.1.1-prerelease.6`.
- `npm test -- --run src/botops/worker-supervisor.test.ts src/botops/nas-worker.test.ts src/botops/windows-worker.test.ts src/db/database.test.ts`: passed at `0.1.1-prerelease.7`, 4 files / 42 tests.
- `npm run typecheck`: passed after worker lifecycle supervisor.
- `npm run worker:nas:supervisor-status`: passed; reported stopped state with public-safe log names.
- `npm run worker:windows:supervisor-status`: passed; reported stopped state with public-safe log names.
- Worker lifecycle smoke passed at `0.1.1-prerelease.7`: `worker:nas:start` started one loop, a second start reported `worker already running; no duplicate started`, `worker:nas:stop` returned `worker stopped`, and final supervisor status was `stopped`; the same start/duplicate/status/stop/status sequence passed for the Windows worker.
- `npm test -- --run src/botops/windows-worker.test.ts src/db/database.test.ts src/botops/contract.test.ts`: passed at `0.1.1-prerelease.8`, 3 files / 25 tests, including unapproved restart blocking, dirty-worktree restart blocking, and fixed `cmd /c win-start.bat` restart execution after exact approval.
- `npm run typecheck`: passed after service restart worker slice.
- `npm run check`: passed at `0.1.1-prerelease.8`, 42 test files / 288 tests, build included.
- `npm run worker:windows:status`: passed at `0.1.1-prerelease.8`; reported `status.read, audit.check, service.restart`, no queued/running/waiting jobs, dirty worktree, free bot lock, and missing config without exposing values.
- `git diff --check`: passed at `0.1.1-prerelease.8`.
- `ggshield secret scan path --recursive --yes --use-gitignore .`: passed at `0.1.1-prerelease.8`.
- `npm test -- --run src/botops/windows-worker.test.ts src/db/database.test.ts src/botops/contract.test.ts`: passed at `0.1.1-prerelease.9`, 3 files / 42 tests, including explicit target-root resolution and DB-path-not-config fail-closed coverage.
- `npm run typecheck`: passed after explicit Windows target-root wiring.
- `npm run check`: passed at `0.1.1-prerelease.9`, 42 test files / 291 tests, build included.
- `git diff --check`: passed at `0.1.1-prerelease.9`.
- `ggshield secret scan path --recursive --yes --use-gitignore .`: passed at `0.1.1-prerelease.9`.
- Live restart smoke: `npm run worker:windows:once` completed the approved `service.restart` job against the live bot repo; follow-up `win-start.bat --status`, `npm run doctor:local`, and `npm run nas:bridge:status` passed in `Attys_DC_BOT`.
- Direction correction validation passed: `npm run plans:check`, `git diff --check`, and targeted `ggshield secret scan path --recursive --yes --use-gitignore AGENTS.md docs\STATE.md docs\CHANGELOG.dev.md docs\codex-tasks\plans\pending\active\botops-nas-windows-control-plane.md`.
