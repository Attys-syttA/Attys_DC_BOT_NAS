Status: done / operator events command

## Cel

- Legyen rovid, Discordbol olvashato operator timeline azokbol az esemenyekbol, amelyek mobilos felugyeletnel fontosak.
- A timeline ne tartalmazzon promptot, error detailt, privat pathot, tokent vagy config erteket.

## Elkeszult reszek

- Bekerult az ignored `operator-events.log`.
- Bekerult a `/events limit:` slash command.
- Az event logba bekerul:
  - startup;
  - lifecycle;
  - approval/question attention;
  - task completed/failed outcome.
- A logolashoz whitelistelt event kind es status token keszul.
- A `/events` csak public-safe formatumu sorokat olvas vissza.
- A help es setup dokumentacio frissult.

## Validacio

- Targeted tests:
  - `npm test -- --run src/bot/operator-events.test.ts src/bot/commands/events.test.ts src/bot/notifications.test.ts src/bot/commands/help.test.ts`
- Teljes validacio:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

## Nyitott reszek

- Kesobb a `/events` kaphat tipus szerinti filtert, ha tul sok event keletkezik.
- Ha tobb bot instance lesz ugyanazon Discord szerveren, az event sorok kaphatnak public-safe instance labelt.
