# Source Gap Audit: Attys_DC_BOT vs chadingTV/codex-discord

Audit date: 2026-06-21

## Baseline

Upstream source:

- Repository: `https://github.com/chadingTV/codex-discord`
- Commit: `dc1afb8e81077fc3e0cbac02c13c69a27d573b8b`
- Commit label observed locally: `dc1afb8 Fix Linux Codex usage refresh`
- Baseline mode: fixed commit, not floating `main`

Local source:

- Repository: `Attys_DC_BOT`
- Commit at audit start: `a331e73bb143d598ff67ddc6183a8a4a8b738f9d`
- Local state at audit start: `main...origin/main`, clean worktree, `origin/main...main` = `0 0`

Scope:

- Included: Discord bot core, commands, normal message flow, slash flow, attachment flow, Codex app-server/session behavior, SQLite state, config/env defaults, public-safe output, usage reporting, docs/setup behavior.
- Excluded: cross-platform launcher, tray, control panel, menubar, platform-specific install/start scripts, platform screenshots except where docs policy affects bot usage.

Status legend:

- `missing`: upstream has it and local does not.
- `partial`: local has a related capability, but behavior or default UX differs.
- `intentional divergence`: local intentionally differs for safety, public-release, or Windows-first operator reasons.
- `superset`: local is broader, stricter, or more operator-friendly than upstream.
- `not in scope`: excluded from this audit slice.

Recommendation legend:

- `no action`: no implementation needed.
- `document only`: keep as documented behavior; no code change.
- `optional feature`: useful only if source parity is desired later.
- `candidate implementation`: real missing or partial behavior worth implementing.

## Executive Summary

There are no upstream-only Discord command files and no upstream-only `.env.example` keys in the audited bot core. The local bot already contains every upstream command area and adds a significantly larger operator surface: `/ask`, `/dashboard`, `/doctor`, `/health`, `/events`, `/logs`, `/mappings`, `/tools`, `/bot`, `Send to Codex`, and more.

The biggest differences are product and safety choices, not missing files:

- Upstream's default workflow is normal Discord messages in registered channels. Local default is slash/context-command control with `DISCORD_ENABLE_MESSAGE_PROMPTS=false`.
- Upstream requires Message Content Intent for its normal chat workflow. Local default does not require Message Content Intent because `/ask` and `Send to Codex` are the primary prompt paths.
- Upstream supports normal message attachments directly. Local supports attachments through `/ask`, `Send to Codex`, and an opt-in normal text+attachment mode; promptless attachment messages are blocked with guidance.
- Upstream docs include English/Korean material and source screenshots. Local intentionally uses English/Hungarian operator language and public-safe/scrubbed documentation rules.
- Local diagnostics, public-safety scrubbing, startup notification, command registration checks, runtime health, and local operator tooling are broader than upstream.

In short: the local bot is not behind the source in command coverage. The remaining source-parity gaps are mostly optional UX parity around normal-message-first operation and some legacy documentation/assets parity that should not be implemented by default.

## Detailed Gap Matrix

| Area | Upstream behavior | Local behavior | Status | Impact | Recommendation |
|---|---|---|---|---|---|
| Discord command files | Upstream command files: `auto-approve`, `clear-sessions`, `last`, `queue`, `register`, `register-paths`, `sessions`, `status`, `stop`, `unregister`, `usage`. | Local has all upstream command areas plus `ask`, `bot`, `dashboard`, `doctor`, `events`, `git-status`, `health`, `help`, `logs`, `mappings`, `run-tests`, `send-to-codex`, `session`, `sugo`, `tools`. | `superset` | No upstream command is missing. Local command surface is larger and more diagnostic-heavy. | `no action` |
| Normal message prompt default | Registered-channel normal messages start or continue Codex work. README typical flow says to send a normal message like `fix the failing tests`. | Normal message prompts are disabled by default through `DISCORD_ENABLE_MESSAGE_PROMPTS=false`. | `intentional divergence` | Upstream-style chat-first usage does not work on a fresh local install unless explicitly enabled. This is deliberate to avoid privileged intent and accidental prompt capture. | `document only` |
| Message Content Intent | Setup guides users to enable Message Content Intent; without it the bot will not respond to normal chat messages. | Message Content Intent is only requested when `DISCORD_ENABLE_MESSAGE_PROMPTS` or `DISCORD_ENABLE_ATTACHMENT_MESSAGES` is true. Slash commands and `Send to Codex` work without it. | `intentional divergence` | Local default is safer and easier for Discord permission review, but differs from upstream's primary UX. | `document only` |
| Slash `/ask` prompt path | Upstream does not have a separate `/ask` command; normal messages are the main prompt path. | Local has `/ask prompt:` with optional `file`, `file2`, and `file3` attachment fields. | `superset` | Local provides an explicit prompt route that avoids Message Content Intent. | `no action` |
| Message context command | Upstream does not provide `Send to Codex` message context command. | Local has `Send to Codex`, including modal prompt for attachment-only selected messages. | `superset` | Local has a better mobile/iPad handoff path than source. | `no action` |
| Promptless attachment messages | Upstream downloads attachments, appends file references, and if no prompt remains returns without starting work. It does not guide the user in that case. | Local replies with guidance: use `Apps -> Send to Codex` or `/ask prompt:` with file fields. | `superset` | Local behavior is clearer and prevents blind work. | `no action` |
| Normal text+attachment messages | Upstream handles normal text plus attachments automatically in registered channels. | Local can do this only when `DISCORD_ENABLE_ATTACHMENT_MESSAGES=true`; default remains disabled. | `partial` | Source-compatible attachment UX is available, but not default. | `optional feature` only if source-like default is later desired |
| Attachment size limit | Upstream skips files over 25 MB. | Local also skips files over 25 MB. | `superset` | No parity gap. | `no action` |
| Blocked attachment types | Upstream blocks dangerous extensions including `.exe`, `.bat`, `.cmd`, `.dll`, script types, etc. | Local blocks the same class of dangerous extensions and sanitizes the saved filename. | `superset` | Local is stricter because filenames are cleaned before saving and displaying. | `no action` |
| Attachment saved path echo | Upstream appends local file paths into the Codex prompt and may mention attachment names in Discord replies. | Local appends local file paths only inside the Codex prompt and avoids echoing saved local paths to Discord. | `superset` | Local reduces local path leakage. | `no action` |
| Queue size | Upstream hard-codes queue max 5 in message handling. | Local uses configurable `DISCORD_QUEUE_MAX_ITEMS`, default 10. | `superset` | Local gives operator control; source parity exactness is not needed. | `no action` |
| Queue UX | Upstream supports queue confirmation and queue list/clear. | Local keeps queue confirmation/list/clear and adds `/queue remove`, better public-safe previews, and operator events. | `superset` | Local queue control is broader. | `no action` |
| Custom user input | Upstream supports Codex user-input questions and resolves custom input from the next normal message. | Local supports the same concept, plus dashboard/status visibility and notification flow. Normal message input is still allowed for pending custom input even when prompts are disabled. | `superset` | Local keeps the upstream interactive path while default prompts stay disabled. | `no action` |
| Approval buttons | Upstream supports accept, accept-for-session, decline, cancel style approval decisions. | Local supports approval cards and adds public-safety hardening, attention notifications, dashboard/status visibility, and scrubbed failure output. | `superset` | Local is safer and more observable. | `no action` |
| Auto-approve | Upstream has `/auto-approve` and project-level `auto_approve`. | Local keeps `/auto-approve`, but gates risky capabilities with `DISCORD_ENABLE_AUTO_APPROVE=false` by default. | `intentional divergence` | Upstream parity exists but local requires explicit enablement for safety. | `document only` |
| Session listing | Upstream `/sessions` lists local Codex threads for the project and lets users select/resume. | Local supports the same and adds `query`, `source`, and `limit` filters plus public-safe labels. | `superset` | Local improves large-session usability. | `no action` |
| Session display paths | Upstream displays project paths in several session/status responses. | Local uses public-safe project labels in public Discord output. | `intentional divergence` | Less raw local path visibility; minor loss of exact path detail in Discord. | `document only` |
| Session deletion | Upstream session select flow can include delete behavior, and `/clear-sessions` exists. | Local supports destructive session cleanup only behind `DISCORD_ENABLE_SESSION_DELETE=false` default gate. | `intentional divergence` | Safer default; source-like destructive flow requires explicit enablement. | `document only` |
| `/last` behavior | Upstream reads last assistant content from local rollout/session storage. | Local keeps rollout fallback and adds safer formatting and app-server fallback handling. | `superset` | No source parity gap. | `no action` |
| Codex app-server command resolution | Upstream resolves Codex command and spawns `codex app-server`. | Local does the same, with Windows `.cmd` invocation hardening to avoid Node 24 shell deprecation issues. | `superset` | Local is more robust on Windows. | `no action` |
| App-server stderr handling | Upstream filters some app-server warning noise. | Local keeps similar behavior and adds more diagnostic commands/log visibility. | `superset` | Better operator diagnosis. | `no action` |
| Runtime health command | Upstream has no `/health`. | Local has `/health` with process, version, command surface, operator tools, usage cache, branch, and repo sync. | `superset` | Local has better operations visibility. | `no action` |
| Doctor/command registration parity | Upstream registers slash commands at startup and logs failures. | Local can skip registration by default and has `/doctor` plus command-surface sanity checks. | `superset` | Local can diagnose stale Discord command registration better. | `no action` |
| Startup notification | Upstream does not send Attys-style central startup status. | Local sends startup notification with launch reason, bot user, operator tools, prompt mode, attachment mode, command registration state, and command count. | `superset` | Better remote/operator awareness. | `no action` |
| Central attention/task notifications | Upstream mentions push notifications as Discord benefit but does not have the same central notification-channel rollup. | Local has `DISCORD_NOTIFICATION_CHANNEL_ID` for startup, approval/question attention, and task outcome updates. | `superset` | Better away-from-desktop operation. | `no action` |
| Logs/events commands | Upstream does not include `/logs` or `/events`. | Local has scrubbed allowlisted log peeks and public-safe operator event timeline. | `superset` | Local has stronger remote diagnosis. | `no action` |
| Git/project commands | Upstream does not include `/git-status`, `/run-tests`, `/bot`, `/tools`, or `/mappings`. | Local adds these behind read-only or explicit safety gates. | `superset` | Better local operator control; larger command surface. | `no action` |
| SQLite DB path | Upstream DB path is fixed as `data.db` in the process cwd. | Local DB path is configurable with `DISCORD_DATABASE_PATH`, default `.discord-bot-state/bridge.sqlite`, with parent directory creation. | `superset` | Local keeps runtime state ignored and repo-local. | `no action` |
| SQLite schema | Upstream has `projects` and `sessions` tables with channel/project/session status fields. | Local schema is compatible in shape and adds `getProjectsByPath` helper for mapping cleanup/use cases. | `superset` | No migration gap against source behavior. | `no action` |
| Env keys | Upstream `.env.example` keys: `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `ALLOWED_USER_IDS`, `BASE_PROJECT_DIR`, `RATE_LIMIT_PER_MINUTE`, `SHOW_COST`. | Local includes all upstream keys plus role auth, application ID, notification channel, DB/session paths, queue max, message/attachment prompt gates, ephemeral replies, registration, run-tests, auto-approve, session-delete, lifecycle. | `superset` | Local has more config and safer defaults. | `no action` |
| `SHOW_COST` default | Upstream config default is `true`. | Local `.env.example` and config default are `false`. | `intentional divergence` | Cost display is quieter/private by default. | `document only` |
| Allowed roles | Upstream supports allowed users only. | Local supports `ALLOWED_USER_IDS` and `ALLOWED_ROLE_IDS`. | `superset` | Easier team/server operation. | `no action` |
| Ephemeral replies | Upstream responses are generally normal deferred replies. | Local has `DISCORD_EPHEMERAL_RESPONSES=true` config, though not every command response is private. | `partial` | Some local commands can be quieter, but not a full global privacy mode. | `optional feature` if a consistent ephemeral policy is desired |
| Public-safe output | Upstream often displays full project paths and raw error strings. | Local sanitizes paths, raw IDs, IPs, and secret-looking fragments in critical public outputs. | `superset` | Local intentionally sacrifices some detail for publishability. | `no action` |
| README workflow | Upstream typical workflow: `/register`, then normal message. | Local typical workflow: `/register`, `/dashboard`, `/ask` or `Send to Codex`. | `intentional divergence` | Users coming from upstream may expect normal chat prompts. | `document only`; already documented in README/SETUP |
| Korean docs/assets | Upstream includes `README.kr.md`, `SETUP.kr.md`, Korean screenshots/assets, and KR UI language. | Local intentionally uses English/Hungarian operator language and public-safe local docs. | `not in scope` | Not a missing bot feature. | `no action` |
| Source screenshots/assets | Upstream includes Discord setup screenshots and panel screenshots. | Local uses public-safe screenshot/illustration policy and avoids private local details. | `intentional divergence` | Local docs may have fewer source-like screenshots. | `optional feature` only with scrubbed/synthetic assets |
| Multi-machine framing | Upstream README describes easy multi-machine setup as one bot per machine, one server for all workspaces. | Local AGENTS/repo scope says multi-machine state sharing and remote execution bridge are out of scope. | `intentional divergence` | Local remains Windows/local-first rather than general multi-host positioning. | `document only` |

## Real Missing Or Partial Items

The audited source does not expose a clear required bot-core feature that is completely missing locally. The realistic parity items are optional or partial:

1. **Source-like normal-message-first UX**
   - Status: `intentional divergence`
   - Current local state: available only when `DISCORD_ENABLE_MESSAGE_PROMPTS=true`.
   - Why not automatic: requires Message Content Intent and increases accidental prompt risk.
   - Recommendation: keep disabled by default; add only docs or a guided setup toggle if upstream-like operation becomes a goal.

2. **Source-like normal text+attachment UX**
   - Status: `partial`
   - Current local state: available when `DISCORD_ENABLE_ATTACHMENT_MESSAGES=true`, plus safer `/ask` and `Send to Codex`.
   - Gap: upstream makes this part of the normal message handler path by default.
   - Recommendation: no default change; optionally add a setup wizard note explaining the opt-in flag.

3. **Consistent ephemeral policy**
   - Status: `partial`
   - Current local state: `DISCORD_EPHEMERAL_RESPONSES=true` exists, but the whole command surface is not a single global ephemeral policy.
   - Gap vs source: not an upstream feature; this is a local polish gap found during comparison.
   - Recommendation: optional future local consistency pass, not source parity.

4. **Legacy English/Korean documentation parity**
   - Status: `not in scope`
   - Current local state: English/Hungarian direction.
   - Recommendation: do not port Korean docs/assets unless the product language direction changes.

5. **Source-like screenshot walkthrough parity**
   - Status: `intentional divergence`
   - Current local state: public-safe Windows screenshot and synthetic/scrubbed docs policy.
   - Recommendation: add only scrubbed or synthetic screenshots when they improve onboarding.

## Recommended Backlog

Only partial or optional source-parity items are listed here. `superset` and safety divergences are not treated as defects.

### P1

No P1 implementation is recommended from this audit. Local bot-core command coverage includes all upstream command areas, and the most visible UX difference is a deliberate safety default.

### P2

- Add a short `SETUP.md` subsection for "Upstream-like normal message mode" that explains:
  - set `DISCORD_ENABLE_MESSAGE_PROMPTS=true`
  - enable Discord Message Content Intent
  - understand that normal messages in registered channels become prompts
  - keep the default slash/context-command mode unless this behavior is explicitly wanted
- Add a similar note for `DISCORD_ENABLE_ATTACHMENT_MESSAGES=true`, explaining that normal text+attachment messages can become Codex prompts but promptless attachments still require instruction through `Send to Codex` or `/ask`.

### P3

- Add more public-safe setup screenshots only if they reveal a real onboarding step not already covered by text.
- Consider a future consistency pass for `DISCORD_EPHEMERAL_RESPONSES`, but do not mix it with source parity.
- Keep Korean docs/assets out of scope unless the product language target changes from EN/HU.

## Validation Notes

Executed on 2026-06-21 after creating this document:

```powershell
git diff --check
npm run plans:check
npm run check
npm run secret:scan
```

Observed:

- `git diff --check`: passed
- `npm run plans:check`: passed, `Checked 1 active plan file(s).`
- `npm run check`: passed; lint, typecheck, tests, and build completed successfully
- `npm test` inside `npm run check`: 38 test files passed, 248 tests passed
- `npm run secret:scan`: passed, `No secrets have been found`
- `git status --short --branch`: only `docs/SOURCE_GAP_AUDIT.md` is untracked for this audit change
