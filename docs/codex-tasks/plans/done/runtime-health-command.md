Status: done / runtime health command

## Cel

- Legyen egy Discordbol hivhato, public-safe bot runtime health riport.
- A `/doctor` maradjon config/Codex readiness jellegu, a `/health` pedig uzemeltetesi allapotot mutasson.

## Elkeszult reszek

- Bekerult a `/health` slash command.
- A riport mutatja:
  - bot process pid es uptime;
  - Node runtime verziot;
  - `bot.err.log` ures / tartalmaz adatot / meg nincs;
  - operator tools utolso public-safe allapotot;
  - Codex usage cache allapotot;
  - bot repo branch, `origin/main...HEAD` parity es clean/dirty worktree allapotot.
- A riport nem ir ki:
  - tokent;
  - raw Discord ID-t;
  - `.env` erteket;
  - privat lokalis pathot;
  - git status reszletes fajllistat.
- A `/help` es setup docs frissult a parancsrol.

## Validacio

- Targeted tests:
  - `npm test -- --run src/bot/commands/health.test.ts src/bot/commands/help.test.ts`
- Teljes validacio:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

## Nyitott reszek

- Ha kesobb tobb bot instance lesz egy Discord szerveren, a `/health` kaphat public-safe instance labelt.
- Ha kell, kesobb kulon `/health detail` opcio adhat bovebb, de tovabbra is scrubbolt riportot.
