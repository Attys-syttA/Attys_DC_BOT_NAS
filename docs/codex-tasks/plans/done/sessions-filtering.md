Status: done / sessions filtering

# Sessions filtering

## Goal

- A `/sessions` maradjon hasznalhato akkor is, ha sok helyi Codex thread van ugyanahhoz a projecthez.
- Discordbol lehessen gyorsan szukiteni title/source/id alapjan.
- A szures read-only legyen, ne valtoztasson stored session allapotot.

## Implemented

- A `/sessions` uj opcioi:
  - `query`
  - `source: all|vscode|codex|discord`
  - `limit: 1-24`
- A select menu csak a szurt session listat mutatja.
- A valasz footer jelzi, hany session latszik az osszesbol.
- Nincs talalat eseten kezelt operatori uzenet jelenik meg.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/sessions.test.ts`
- Teljes validacio a commit elott:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

