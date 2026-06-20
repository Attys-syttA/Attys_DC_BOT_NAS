Status: done / health version visibility

# Health version visibility

## Goal

- Discordbol latszodjon, melyik bot package verzio fut eppen.
- A `/health` kozelebb legyen a Windows tray lifecycle panel informacioihoz.
- A verziojelzes public-safe maradjon, config vagy path kiirasa nelkul.

## Implemented

- A `/health` olvassa a repo `package.json` `version` mezojet.
- A health riport uj sora: `bot version`.
- Olvasasi vagy parse hiba eseten `unknown` jelenik meg.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/health.test.ts`
- Teljes validacio a commit elott:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

