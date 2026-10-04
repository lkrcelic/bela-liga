# Blockers and open items

No screen is blocked. Items resolved in the follow-up round:

- ~~No backend for Manage League / Create League~~ — added (DECISIONS 11).
- ~~League picker limited for players~~ — `GET /api/leagues` is public; season tables are public for every league (DECISIONS 9).
- ~~Player search matches usernames only~~ — now also first and last names (DECISIONS 20).
- ~~Route transitions / card morph~~ — View Transitions API (DECISIONS 7).
- ~~Old components left unused~~ — removed (DECISIONS 19).

Still open:

1. **Desktop "Start Game" lives in the navigation drawer** (as designed; the desktop home has no start button).
2. **View transitions could not be watched live in this session's browser pane** (it was hidden, and browsers skip
   view transitions in hidden documents). Verified instead: the transition CSS is injected, the morph pairs exactly one
   `table` element before and after, the update resolves when the new route is committed (5–600 ms in dev, before
   the 1.5 s safety timeout) and the CSS fallback is switched off while a transition runs. Worth a quick look in
   Chrome or Safari 18.
3. **Server-side session check**: the middleware only verifies the cookie signature. The client now sends an
   invalid session to the login page, but a proper fix is to validate the session in the middleware.
4. **Nothing is pushed.** All work is committed on the local branch `feat/new-screens`; master is untouched.
