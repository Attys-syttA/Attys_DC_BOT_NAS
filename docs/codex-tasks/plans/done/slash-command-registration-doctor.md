# Slash command registration doctor

Status: done

## Goal

Make `/doctor` able to detect the common remote-control failure mode where the bot process is healthy, but Discord still has an older or incomplete guild slash command registration.

## Implemented

- Added a command-surface helper with the expected slash command names from the local help registry.
- Added live Discord guild command inspection through the bot token and configured guild.
- `/doctor` now reports:
  - expected local command surface size
  - whether startup slash command registration is enabled
  - live guild command registration parity
  - missing command names, if any
  - extra command names, if any
- Live Discord API failure is non-fatal and reported as `INFO slash command registration live check unavailable`.

## Safety Rules

- `/doctor` still does not print token values, raw guild IDs, raw user IDs, or application IDs.
- Registration diagnostics print command names only.
- Missing/extra command lists are capped for display.
- The check is read-only and does not register, delete, or mutate Discord commands.

## Validation

- Focused tests cover exact parity and missing/extra registration summaries.
- `/doctor` tests cover the new lines without exposing config values.
- Full repository validation is required before commit:
  - `npm run check`
  - `git diff --check`
  - `ggshield secret scan path --recursive --yes --use-gitignore .`
