Status: done / Discord error public-safety hardening

# Discord error public-safety hardening

## Goal

- Keep local diagnostics useful in console/logs.
- Prevent Discord-visible validation and Codex startup errors from exposing local paths or secret-looking values.

## Implemented

- `validateProjectPath` now returns generic public-safe path errors.
- Codex thread resume/start errors are sanitized before sending to Discord.
- Codex turn start errors are sanitized before sending to Discord.

## Validation

- Security guard tests assert no path detail appears in validation errors.
- Session manager tests assert start-turn failures are scrubbed before Discord output.
- Full repo validation and secret scan were run before commit.

## Notes

- Console logs may still include local diagnostic detail on the operator machine.
- Discord-visible output is intentionally less detailed.
