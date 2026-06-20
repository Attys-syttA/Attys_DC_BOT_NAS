## Summary

- 

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run check`
- [ ] `ggshield secret scan path --recursive --yes --use-gitignore .`

## Safety

- [ ] No `.env`, tokens, Codex auth state, SQLite runtime files, or local logs are included.
- [ ] No real Discord IDs, private local paths, credentials, or host-specific secrets are included in docs/tests/examples.
- [ ] Any Git/update behavior is clean-checkout safe and does not stash/reset local work without explicit approval.
