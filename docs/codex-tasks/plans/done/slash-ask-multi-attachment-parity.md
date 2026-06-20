Status: done / slash ask multi attachment parity

# Slash ask multi attachment parity

## Goal

- A slash-only `/ask` flow kozelebb legyen a normal message attachment flow-hoz.
- Egy prompttal tobb fajlt vagy kepet lehessen adni a Codexnek.
- Discordon tovabbra se jelenjen meg lokalis mentett path.

## Implemented

- A `/ask` harom opcionális attachment slotot kapott:
  - `file`
  - `file2`
  - `file3`
- A letoltott fajlok kozos Codex prompt suffixbe kerulnek.
- A Discord visszaigazolas csak safe fajlneveket mutat.
- A veszelyes fajlok es tul nagy fajlok tovabbra is kulon skip uzenetet kapnak.

## Validation

- Celzott teszt:
  - `npm test -- --run src/bot/commands/ask.test.ts`
- Teljes validacio a commit elott:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

