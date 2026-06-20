Status: done / operator task outcome notifications

## Cel

- A mobil/operator csatorna ne csak akkor jelezzen, amikor Codex emberi inputot ker.
- A Codex turn vege is latszodjon kozpontilag: siker vagy hiba.

## Elkeszult reszek

- Bekerult a `buildOperatorTaskOutcomeNotification` es `sendOperatorTaskOutcomeNotification` helper.
- `turn/completed` sikeres statusznal a bot `completed` kozponti statuszt kuld.
- `turn/completed` failed statusznal a bot `failed` kozponti statuszt kuld.
- Ha a notification channel ugyanaz, mint az aktiv project channel, nincs duplikalt kozponti uzenet.
- A failed notification szandekosan nem tartalmaz error detailt, stacket, privat pathot vagy promptot.
- A teljes eredmeny tovabbra is az aktiv project channelben marad.

## Validacio

- Targeted tests:
  - `npm test -- --run src/bot/notifications.test.ts src/codex/session-manager.test.ts`
- Teljes validacio:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

## Nyitott reszek

- Ha kesobb tobb bot instance fut egy szerveren, a completion notification kaphat public-safe instance labelt.
- Kulon zajcsokkento opcio akkor kell, ha a completion notification tul gyakori lesz.
