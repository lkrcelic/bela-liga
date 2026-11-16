# Bela Treseta Tournament app

## Deployments

- `development` branch: https://bela-liga-git-development-lkrcelics-projects.vercel.app/ — always the same address, so use it to look at what is on `development`. A cloud session reaches it only if that host is allowed for the session's environment; otherwise run the app locally instead.

## Tests

- A commit that changes logic or a user flow carries its test (unit, db or Playwright), written by its author; a bug fix carries a test that is red without the fix. The `testovi` skill says which test and how.
- Before committing a behaviour change: `npm test`, `npx tsc --noEmit`, then the `e2e-reviewer` agent on the staged diff.
- The `pre-commit` hook in `.githooks/` runs `npm test`; enable it once per clone with `git config core.hooksPath .githooks`.

## Supported layouts

- Phone: portrait only. Landscape on the phone is not supported, so don't design or fix for it, and don't report landscape-only problems as bugs.
- Computer: supported.
