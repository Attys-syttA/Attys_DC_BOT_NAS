Status: done / user-input queue preview safety

# User-input and queue preview safety

## Goal

- Keep Codex user-input cards and queue UX useful from Discord.
- Avoid exposing private paths, raw IDs, IPs, or secret-looking values in question cards and prompt previews.
- Preserve the actual prompt sent to Codex unchanged.

## Implemented

- Codex question headers, question text, option labels, option descriptions, select labels, and button labels are sanitized before display.
- `/queue list` and `/queue remove` previews are sanitized.
- Queue-processing notices sanitize the queued prompt preview.
- `/ask` Discord acknowledgement sanitizes only the displayed prompt preview.

## Validation

- Output formatter tests cover sanitized question cards.
- Queue command tests cover sanitized list/remove previews.
- Full repo validation and secret scan were run before commit.

## Notes

- This is display-only hardening.
- Codex still receives the original local prompt and attachment references.
