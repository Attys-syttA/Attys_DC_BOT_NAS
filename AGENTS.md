# Repository Guidelines

## 1. Scope

This repository is `Attys_DC_BOT_NAS`, a historical/reference NAS-side BotOps experiment for the Discord-controlled Codex workflow.

Target GitHub repository:

- `https://github.com/Attys-syttA/Attys_DC_BOT_NAS`

## 2. Architecture

Current direction:

```text
Discord
  -> Attys_DC_BOT source-of-truth
  -> NAS handoff/control-plane helpers and limited workers maintained there
  -> this repository only as reference/superseded material
```

Source-of-truth rule:

- Active BotOps contracts, Discord commands, NAS handoff/control-plane helpers, and limited worker execution belong in `Attys_DC_BOT`.
- Do not add new runtime behavior here unless a later explicit migration plan reopens this repository.
- Do not run this repository as a second competing BotOps runtime beside `Attys_DC_BOT`.

Default safety model:

- staged autonomy with explicit approval gates
- no arbitrary shell execution from Discord
- no automatic source writes, commit, push, deploy, cleanup, restart, or NAS-side write actions
- NAS execution starts with fixed allowlisted status/check tasks only, from the source-of-truth repository

Explicitly out of scope until a separate approved plan exists:

- free-form remote shell execution
- unattended Codex repair/apply/commit/push/deploy
- NAS-side source write, rebuild, container deploy, or service restart
- changing approval requirements or adding new capabilities without a plan update

## 3. Startup and Safety

Before modifying files:

- follow the parent `<CODEX_WORKS>\AGENTS.md` Windows MCP / Serena startup hygiene rules
- run `git status` if this folder is a Git repository
- inspect relevant files before editing
- keep changes small and reviewable

If this folder is not yet a git repository, report that clearly before assuming branch state.

## 4. Coding Defaults

- Node.js 20+
- TypeScript with ES modules
- `discord.js` v14
- SQLite through `better-sqlite3`
- BotOps jobs and approvals must use the repository's canonical contract types
- 2-space indentation
- double quotes
- semicolons
- explicit `.js` import specifiers in TypeScript source

## 5. Sensitive Data

Never commit:

- Discord bot tokens
- OpenAI API keys
- Codex auth state
- GitHub credentials
- email addresses
- real Discord guild/user IDs
- private hostnames or IPs
- Windows user-specific paths
- `.env`
- runtime SQLite state
- rollout logs
- upload/cache/runtime folders

Use synthetic placeholders in docs, examples, and tests.

## 6. Required Ignore Policy

The repository must ignore local env, runtime state, SQLite files, logs, build output, dependency folders, and upload/cache folders.

## 7. Validation

For implementation changes, run:

```powershell
npm run typecheck
npm test
npm run build
npm run check
```

Before meaningful commit or publication, run:

```powershell
ggshield secret scan path --recursive --yes --use-gitignore .
```

If `ggshield` is unavailable, document that and do a manual secret-pattern scan.

## 8. Git

- Do not commit automatically.
- Do not push automatically.
- Do not rewrite the remote history without explicit approval.
- The target remote is `Attys-syttA/Attys_DC_BOT_NAS`.
