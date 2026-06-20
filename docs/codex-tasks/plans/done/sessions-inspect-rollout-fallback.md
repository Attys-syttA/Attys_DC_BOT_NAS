Status: done / sessions inspect rollout fallback

# Sessions inspect rollout fallback

## Goal

- A `/sessions` select reszletnezet legyen ugyanolyan robusztus, mint a `/last`.
- Ha a live Codex app-server thread olvasas nem elerheto, a session inspect is probaljon helyi rollout JSONL fallbacket.
- Ne jelenjen meg nyers app-server hiba Discordon session valasztaskor.

## Implemented

- A `/last` fallback logika kozos `readLastResponseWithFallback` helper lett.
- A `/sessions` select handler ezt a helpert hasznalja az utolso assistant valaszhoz.
- Live read hiba vagy ures valasz eseten a select panel tovabbra is megmutatja a Resume/Delete/Cancel gombokat.

## Validation

- Celzott tesztek:
  - `npm test -- --run src/bot/commands/last.test.ts src/bot/handlers/interaction.test.ts`
- Teljes validacio a commit elott:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`

