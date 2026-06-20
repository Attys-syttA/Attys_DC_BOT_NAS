Status: done / remote log peek command

# Remote log peek command

## Goal

- A bot legyen diagnosztizalhato akkor is, amikor nincs elerheto VS Code vagy Windows desktop panel.
- Discordbol lehessen rovid, read-only log tailt kerni a fontos helyi bot logokbol.
- A valasz ne legyen nyers logdump, es ne tegyen ki privat lokalis adatot Discordra.

## Implemented

- Bekerult a `/logs` slash command.
- Engedelyezett logforrasok:
  - `bot`
  - `error`
  - `operator-tools`
  - `events`
  - `update`
- A `lines` opcio 1 es 30 sor kozott allithato.
- A parancs csak repo-lokalis, elore ismert logfajlokat olvas.

## Safety

- A Discord valasz scrubolja:
  - Windows es Unix-szeru lokalis pathok
  - raw Discord-szeru ID-k es channel mentionok
  - IPv4 cimek
  - token/secret/key/password-szeru env assignmentek
  - hosszu secret-szeru tokenek
- Hianyzo log eseten a parancs kezelt, rovid uzenetet ad.
- A parancs read-only; nem indit processzt es nem modosit lokalis allapotot.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/logs.test.ts`
- Teljes validacio a commit elott:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

