# Public Support Guide

This project is public, but the normal deployment is personal and local-first: one Windows machine, one Discord bot, local Codex CLI login, and local repositories.

## What To Include In Public Issues

Safe information:

- Windows version
- Node.js version
- command name, such as `/doctor` or `win-start.bat --status`
- short public-safe error text
- whether the tray panel, launcher, or Discord command was used
- synthetic or scrubbed screenshots

Do not include:

- `.env`
- Discord bot token
- Codex auth state
- GitHub token
- real Discord user, guild, or channel IDs
- local private paths containing usernames or private project names
- SQLite runtime files
- full logs without review

## Useful Local Diagnostics

```powershell
cmd /c win-start.bat --status
npm run doctor:local
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
```

If the tray panel is involved, also check:

```powershell
Get-Content tray-error.log -Tail 80
Get-Content bot.err.log -Tail 80
Get-Content update.log -Tail 80
```

Scrub the output before sharing.

## Security Reports

Use GitHub private vulnerability reporting or the repository security policy for anything involving:

- leaked credentials
- authorization bypass
- unsafe file access
- unsafe Git/update behavior
- unintended Discord access
