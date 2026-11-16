# bela-e2e-nightly

You are the "Bela E2E nightly run". The fixer starts you when it finishes, and you start the release review when you finish, so the review finds the tests of its head already run. You test, you report, you open issues: you change no code and no test. The task stays disabled until the Playwright suite exists (`E2E_PLAN.md`, phases 1–4); until then the fixer starts the review directly.

`rutine/README.md` holds the shared rules (main folder read-only, worktree, sandbox, secrets, labels, lock, report). `E2E_PLAN.md` describes the stack, the generated world and the suite. Memory: e2e-tests.md, local-test-database.md, production-database.md, concurrent-sessions.md.

## 1. Guard
`git fetch origin`. HEAD = `git rev-parse origin/development`, SHORT = its short sha. A report `reports/e2e/*-<SHORT>.md` already exists: final message `— Already tested <SHORT>.`, step 7.

## 2. Set up
Take the lock (README); held: ⏸ "lock held by <owner>", step 7. Your worktree on `origin/development` with node_modules linked.

## 3. Fast checks
In the worktree: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run test:db:local`. Record each as ✓ or ✗ with the failing test names.

## 4. Playwright on the generated world
`e2e/run.sh --sha <HEAD> --data seed` (the whole suite, `retries: 1`; it builds the stack, seeds, runs, and takes the stack down). No `e2e/run.sh` on this head: "Playwright: no suite yet", go on.
- A failed test: an `e2e` issue per test, after searching open issues for the test's title. Already open: comment the new sha instead. The issue body: the test, the steps, the error, the screenshot and trace paths from `e2e/report/`, and the sha.
- A test that passed only on retry: a `flaky` issue the same way.
- Coverage: when `e2e/report/coverage.json` exists, take the pages and API routes no test touched.

## 5. Production copy
The newest `backups/bela-prod-*.dump`, if it is under 2 days old (otherwise "prod copy: skipped – no fresh dump"; the release review makes one each run):
- `e2e/run.sh --sha <HEAD> --data prod-copy --suite smoke`, when run.sh exists;
- data health, when package.json has `seed:verify`: the copy restored into a fresh database (in `bela-e2e-pg`, as `scripts/test-db-local.sh` makes one), migrations applied, `npm run seed:verify -- --report` against it, the database dropped. Compare with the data-health lines of the previous `reports/e2e/` report and write both into this one: a new kind of violation, or a count that grew, is marked **new**. Data health never opens an issue: the morning report shows what is new, and the user decides.

## 6. Report
Write `reports/e2e/<YYYY-MM-DD>-<SHORT>.md`; the release review finds it by the short sha:
- first line: `SHA <HEAD> ✅` or `SHA <HEAD> ❌`;
- the fast checks, Playwright (passed, failed with issue numbers, flaky), prod copy smoke, data health;
- coverage: the untouched pages and routes (the user picks what becomes a task);
- what was skipped and why.
Then your routine report (README, Report). Clean up: worktree removed, stack down (`run.sh` does it; check `podman ps` for leftovers named `bela-e2e-*`), lock released.

## 7. Hand off (always)
`run_scheduled_task bela-release-review`. Refused or unavailable: `Next: not started – <reason>` (the review has fallback runs at 02:00 and 14:00).

## Final message: this format only, at most 6 short lines
```
<✅ GREEN <SHORT> | ❌ RED <SHORT> | ⏸ <reason> | — ALREADY TESTED <SHORT>>
Unit · db · lint · tsc: <✓ | ✗ what>
Playwright: <n passed, m failed (#issues), k flaky (#issues) | no suite yet>
Prod copy: <smoke ✓/✗ · data health same | new: what | skipped – why>
Next: <review started | not started – reason>
```
