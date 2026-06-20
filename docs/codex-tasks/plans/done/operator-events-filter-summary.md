Status: done / operator events filter summary

# Operator events filter and summary

## Goal

- A `/events` timeline legyen gyorsabban hasznalhato mobilrol vagy tavolrol.
- Az operator tudja kulon nezni a startup, lifecycle, attention es task outcome esemenyeket.
- A parancs adjon rovid public-safe osszegzest, ha a teljes timeline tul zajos.

## Implemented

- A `readOperatorEvents` megtartotta az alap mukodest, de kapott opcionális `kind` filtert.
- Bekerult a `summarizeOperatorEvents`, amely darabszamokat ad event tipus es statusz szerint.
- A `/events` slash command uj opcioi:
  - `kind: all|startup|lifecycle|attention|task`
  - `summary: true|false`
- A help, README, SETUP es release checklist dokumentacio frissult.

## Safety

- A log olvasas tovabbra is csak a szigoru public-safe event formatumot engedi at.
- A summary nem jelenit meg promptot, raw error detailt, tokent, privat pathot vagy config erteket.
- A lokalis `operator-events.log` ignored runtime fajl marad.

## Validation

- Celzott tesztek:
  - `npm test -- --run src/bot/operator-events.test.ts src/bot/commands/events.test.ts`
- Teljes validacio a commit elott:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

