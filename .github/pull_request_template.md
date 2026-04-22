## Summary

Briefly describe what changed and why.

## Related thesis references

- Use case(s): UC-XXX
- Functional requirements: FR-X
- Non-functional requirements touched: NFR-XX

## Checklist

- [ ] Backend tests pass locally (`npm test` in `backend/`)
- [ ] Frontend tests pass locally (`npm test` in `frontend/`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] Mongolian strings live in `locales/mn.json`, not hardcoded
- [ ] New screens support dark mode and work at 375px width
- [ ] No gradients, glow, glassmorphism, or emoji in the UI
- [ ] No secrets committed (`.env` files, API keys)
- [ ] Validation messages are in Mongolian and user-friendly
- [ ] New DB changes are in a migration file (not a manual edit)

## Test plan

How did you verify this change? Steps a reviewer can run.
