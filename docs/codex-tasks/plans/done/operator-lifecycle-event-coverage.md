# Operator lifecycle event coverage

Status: done

## Goal

Make the Discord-side operator timeline useful for manual control actions, not only startup, attention, and Codex task outcomes.

## Implemented

- Session lifecycle actions record public-safe events:
  - `session-new`
  - `session-stop`
  - `session-delete`
- Queue lifecycle actions record public-safe events:
  - `queue-add`
  - `queue-clear`
  - `queue-remove`
- Mapping cleanup records `mapping-remove` from both `/unregister` and `/mappings` cleanup buttons.
- Discord-triggered `/bot restart` records `bot-restart` when the restart is scheduled.
- `/events status:` filtering covers these lifecycle statuses through the existing public-safe event log.

## Safety Rules

- Event lines stay in the existing `operator-events.log` format.
- Event status values are fixed public-safe tokens.
- Channel context is recorded only through the existing public-safe channel formatter.
- No prompts, local paths, raw config values, or error details are written by these lifecycle events.

## Validation

- Focused lifecycle/event tests cover status filtering and direct command/handler event writes.
- Full repository validation is required before commit:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`
