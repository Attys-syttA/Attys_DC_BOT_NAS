# Project State

## Current Status

- Date: 2026-08-18
- Repository folder: `<CODEX_WORKS>\Attys_DC_BOT_NAS`
- Target remote: `https://github.com/Attys-syttA/Attys_DC_BOT_NAS`
- Phase: NAS BotOps control-plane baseline in progress
- Package version: `0.1.1-prerelease.6`
- Active plan: `docs/codex-tasks/plans/pending/active/botops-nas-windows-control-plane.md`

## Current Goal

Make Discord the main operator surface while keeping execution staged, allowlisted, logged, and approval-gated across the NAS control plane and the limited Windows execution plane.

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
  - fixed helper registry for `status.read` and `audit.check`
  - worktree dirty preflight
  - bot lock inspection without stopping processes
  - config presence check without printing values
  - `audit.check` runs only the fixed `npm run check` helper and blocks on dirty or missing config
  - `service.restart` remains unhandled by the worker in this slice
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

## Open Work

1. Add worker lifecycle launch supervision only after explicit operator approval.
2. Add cross-repo Discord command integration if the live `Attys_DC_BOT` command surface remains the production control surface.
3. Validate live Discord command registration only after explicit operator approval to restart or redeploy the bot.
4. Decide whether `service.restart` should get a separate supervised worker slice.
5. Decide the NAS publication/deploy route for this repo.

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
