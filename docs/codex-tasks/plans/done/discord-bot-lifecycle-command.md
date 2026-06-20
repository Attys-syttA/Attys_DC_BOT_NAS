Status: done / Discord bot lifecycle command

# Discord bot lifecycle command

## Goal

- Tavoli hasznalatkor Discordbol is latszodjon, fut-e a helyi Windows launcher szerinti bot.
- Legyen opcionális, explicit engedelyhez kotott bot restart, ha a desktop panel nem elerheto.
- A restart ne legyen alapbol bekapcsolva, es ne legyen destruktiv update/recovery parancs.

## Implemented

- Bekerult a `/bot action: status|restart` slash command.
- `status` read-only modon a `win-start.bat --status` kimenetet mutatja.
- `restart` csak `DISCORD_ENABLE_BOT_LIFECYCLE=true` mellett mukodik.
- Restartkor a parancs elobb visszair Discordra, majd kulon detached Windows processzben inditja a launchert.

## Safety

- Alapertelmezett allapot: `DISCORD_ENABLE_BOT_LIFECYCLE=false`.
- Nincs `git pull`, `git reset`, `git stash`, update vagy dependency muvelet.
- Nincs nyers path vagy secret a Discord valaszban.
- A stop-only muvelet direkt nem kerult be, mert tavolrol konnyen megszakitana az operatori kapcsolatot.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/bot.test.ts src/bot/commands/help.test.ts`
- Teljes validacio a commit elott:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

