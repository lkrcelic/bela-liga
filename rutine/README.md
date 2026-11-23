# Bela routines

The scheduled routines of this repo work as one team. Each local scheduled task only says "read `rutine/README.md` and `rutine/<id>.md` from `origin/development` and follow them", so these files are the routines: a change to a routine is a commit, reviewed by the release review like code. Read this file first, then your own.

## The team

| Routine | Where | When (Zagreb) | Job | Hands off to |
| --- | --- | --- | --- | --- |
| `bela-github-issue-fixer` | laptop | 00:00 and 12:00 | one issue → fix with its test → `development` | `bela-release-review` |
| `bela-e2e-nightly` | laptop | 01:00 | unit, db and Playwright tests on the head, a data check of the production copy (report only) | — (the review's 02:00 run reads its report) |
| `bela-release-review` | laptop | started in the chain; fallback 02:00 and 14:00 | reviews `master..development`, tests, prepares the deploy; deploys only after the user's "deploy" | — |
| `bela-nightly-sync` | laptop | 05:00 | deployed Bela commits → Treseta branch `bela-sync` | `treseta-e2e-nightly` |
| `treseta-e2e-nightly` | laptop | started by the sync; fallback 06:15 | Treseta's unit, db, lint and tsc (Playwright later) on its `master` and `bela-sync`; prompt in Treseta's `rutine/` | its report, read by the morning report |
| `bela-jutarnji-izvjestaj` | laptop | 06:45 | one morning message for the user | — |
| `bela-app-scan` | cloud | Mon and Thu 07:00 | static code review | issues `auto-scan` |
| `bela-mobile-ux-patrol` | cloud | 03:00 | phone screens on the generated world (`npm run seed:e2e`) | issues `mobile-ux-scan` |

The chain hands off with the scheduled-tasks tool `run_scheduled_task`. The fallback crons only catch a broken chain: every routine has a guard, so a fallback finds its work done and stops.

**Cloud routines** (scan and UX patrol) run on claude.ai in a fresh clone: their routine's prompt only says to check out `development` and follow `rutine/<id>.md`. Of this file, only The team and Issues apply to them; the main folder, sandbox, lock and report rules are the laptop's. Their report is the issues they file.

## Places

- Bela repo (the main folder): `/Users/lovro/projects/github/Bela-Treseta-Tournamnet-app`, GitHub `lkrcelic/bela-liga`. `development` is the working branch, `master` is live production (Vercel builds it and runs its migrations).
- Treseta repo: `/Users/lovro/projects/github/Treseta-tournamnet-app` (the sync and `treseta-e2e-nightly` work there). Treseta's own routine reads its prompt from Treseta's `rutine/` on Treseta's `master`, and writes its report here, in this repo's `reports/rutine/`, and takes this repo's lock.
- Memory: read `/Users/lovro/.claude/projects/-Users-lovro-projects-github-Bela-Treseta-Tournamnet-app/memory/MEMORY.md` and the files your routine names. Follow them.
- Your scratchpad: the scratchpad directory of your session. Worktrees, screenshots and throwaway databases go there.

## Shared rules

- **The main folder is shared** with interactive sessions, which keep uncommitted work in it. Treat it as read-only: no edit, stash, checkout, reset or commit there. The two writable places are the gitignored `backups/` and `reports/`. Code work happens in your own worktree: `git worktree add --detach <scratchpad>/wt origin/development`, then `ln -s <main folder>/node_modules <scratchpad>/wt/node_modules` (`npm ci` there instead when its package-lock.json differs). `git worktree remove` it at the end.
- **Production is the user's call.** Only `bela-release-review` touches `master`, only after the user approves the deploy in its session, and only with the commit-tree merge in its step 7. What the user doesn't approve waits on development for the next proposal. Never force-push.
- **Secrets.** The production database URL is in `backups/.prod-db-url`: use it in commands, never print it, copy it or put it in a message, file or issue.
- **Sandbox.** Network, `git fetch`/`push`, `gh`, `pg_dump`, podman and anything on localhost need the sandbox off. Use `gh api` (REST); when `GITHUB_TOKEN` gives "Bad credentials", run `env -u GITHUB_TOKEN gh api …`.
- **Commits.** The repo's own style: a plain sentence or two saying what changed and why, `fixes #N` for an issue. No Claude attribution and no Co-Authored-By line.
- **Tests.** The `testovi` skill (`.claude/skills/testovi/SKILL.md`) decides which test goes with a change and how it is written; the `e2e-reviewer` agent checks the tests of a diff against it. The `pre-commit` hook runs `npm test` on every commit, so link node_modules before committing. `npm run test:db:local` runs the db tests on a fresh local database (outside the sandbox).

## Issues

GitHub issues are the team's work queue. Labels:
- **source:** `auto-scan` (scan), `mobile-ux-scan` (UX patrol), `e2e` (a red Playwright test), `flaky` (passed only on retry), `user` (filed by the user);
- **state:** `fixer-radi` (the fixer is on it, nobody else touches it), `na-developmentu` (fixed on development, waiting for the deploy that closes it through `fixes #N`), `treba-korisnika` (a question for the user; the fixer skips it until the user answers);
- and the existing `type: …`, `priority: …`, `effort: …`, `area: …`.

Before opening an issue, search the open ones and the ones closed in the last 7 days for the same problem (and for the commit sha, when the issue is about a commit). Comment on the existing one instead of opening a second.

## Lock

Heavy local work takes the lock: a local Postgres (embedded or podman), `next build`/`next start`, headless Chrome, the production copy, the E2E stack.
- Take it: `mkdir backups/.rutina.lock` (atomic; it fails when someone holds it), then write `<routine id> <ISO time>` into `backups/.rutina.lock/owner`.
- Held, and the owner's time is under 3 hours old: skip your heavy steps, and end ⏸ with "lock held by <owner>". Your guard stays unwritten, so the next run retries.
- Held for 3 hours or more: it is stale. Remove it, take it, and say so in your report.
- Release it (`rm -rf backups/.rutina.lock`) as soon as the heavy steps are done, and in your clean-up whatever happened.

## Report

Every run ends by writing `reports/rutine/<YYYY-MM-DD>/<routine id>.md` in the main folder (the date of the run's start, Zagreb). Contents: your final message, then at most 10 lines of detail (sha, issue, commit, what failed). A second run on the same day appends under a `## HH:MM` heading. The morning report reads only these files and GitHub, so a run without its report did not happen for the user.
