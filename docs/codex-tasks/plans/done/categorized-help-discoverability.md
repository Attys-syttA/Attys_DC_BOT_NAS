Status: done / categorized help discoverability

# Categorized help discoverability

## Goal

- A megnott slash command felulet legyen gyorsan attekintheto Discordon.
- A `/help` es `/sugo` ne csak lapos listat adjon, hanem operatori kategoriakat.
- A reszletes parancssugo maradjon kompatibilis a `parancs` opcioval.

## Implemented

- A help entry-k kategoriat kaptak:
  - Codex work
  - Sessions and queue
  - Repo and mappings
  - Operator diagnostics
  - Gated safety controls
- A listanezet rovid kezdo parancs sort kapott.
- A reszletes parancsnezet megmutatja az adott parancs kategoriajat.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/help.test.ts`
- Teljes validacio a commit elott:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

