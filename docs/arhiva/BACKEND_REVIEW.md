# Backend review

A pass over every API route, service and the standings SQL functions, looking for small logical errors.

## Fixed (committed on `feat/new-screens`)

| # | Problem | Fix |
|---|---------|-----|
| 1 | A finished match's `start_time` was the ongoing match's time-of-day copied into a timestamp, so every match "started" on 1970-01-01. The ongoing match's `CURRENT_TIME` default also used the database's time zone, so the start could come after the end. | Date and time are joined when the match is finished; the start time is set by the app in UTC. Verified: start 09:41:34, end 09:41:35 on the right day. |
| 2 | A round's matches came back in no defined order (Kraj kola lists "Meč 1, Meč 2"). | Ordered by id. |
| 3 | `GET /api/teams/:id` validated `teamPlayers` but never loaded them, so it always answered 400. | Players are loaded. |
| 4 | Team lists loaded whole player rows, emails and password hashes included (the response stripped them, but they were read from the database). | Only id, username and names are loaded; teams sorted by name. |
| 5 | Creating a team with a player id that doesn't exist was a 500. | 400 with a message. |
| 6 | An expired or unknown Google session cookie made the user anonymous even with a valid password session. | Falls through to the password session. Verified with a stale Google cookie. |
| 7 | Pairings by round number (`/api/roundMatchups/:n`) mixed rounds of every league, while round numbers count up per league. Now that leagues can be created, this collides. | The league is part of the query (default: current league); Create Round passes it. |
| 8 | Start Game picked the open round with the lowest round number across all nights, so a round never played on an earlier night blocked tonight's. | Latest night first, then the lowest round number. |
| 9 | Google sign-up kept only the second word as last name ("Ana Marija Horvat" → "Marija"). | Everything after the first name. |
| 10 | `/api/session` answered 405 to non-admins. | 401 / 403. |

## Decided and done

Your decisions on the open items, and what was built.

| # | Item | Decision | What changed |
|---|------|----------|--------------|
| A | Sessions ended 4 h after login (the cookie was never re-issued) | My call | Password and Google sessions last **30 days, sliding**: every app load (`/api/auth/me`, also when a phone brings a tab back after 15 min) pushes the expiry out and re-issues the cookie with the same expiry. Settings in `_lib/sessionConfig.ts`. |
| B | `GET /api/rounds?open=` filtered `active` | As suggested | `open` filters unfinished rounds; new `active` filters rounds with a match being played. |
| C | League standings only listed teams that had finished a round | List every team | Every team of the league is listed (zeros until it plays, inactive teams too), sorted by points, difference, name. The podium waits until someone has played. |
| D | Inactive teams | Off by default, can be switched on | Create Round starts inactive teams switched off; the admin can switch them on, and Select all includes them. The server accepts them as before. |
| E | A bye counts as two matches won 301:0 | Keep | — |
| F | Ratings change for the whole roster | Later | — |
| G | Google email matched case-sensitively; Google players got today as birth date | Match and ask | The email lookup ignores case and a Google login links to the existing player with that email. `Player.birth_date` is optional; the migration clears the placeholders of earlier Google sign-ups, and the app asks once in a sheet (never during a match; "Kasnije" asks again next time). |
| H | Successful logins counted toward the login limit | Count only failed | The limit moved from the middleware into `/api/login`: wrong passwords count, a successful login clears the count. |
| I | The middleware trusted any signed cookie | Best practice | Kept the middleware as an optimistic check (it runs on the edge runtime without the database, which is what Next.js recommends); the real check stays in every API route. New: `/api/auth/me` removes the cookie of a session that no longer exists, so after the first load the middleware itself sends that browser to `/login`. |

Verified on the dev server: the session expiry moves to +30 days on load; an expired session gets 401 from
`/api/auth/me`, its cookie is cleared and `/` then redirects to `/login`; six successful logins in a row all pass while
the 6th failed one gets 429; `?open=` / `?active=` return the right rounds; a league without rounds lists its four
teams; an inactive team can be switched on and counted; the birth-date sheet appears for a player without one, saves,
and refuses a future date (400) or another player's profile (403).

### Worth knowing

- **Google login wasn't run end to end** (it needs real Google credentials). The email lookup and the linking setting
  are small, but try one Google login with an existing password account before relying on it.
- **Linking by email trusts the email of password accounts**, which is never verified. Someone could sign up with a
  password using another person's email; if that person later logs in with Google, they land in that account (which
  the first person can also open with the password). Low risk in a closed league; the fix would be email verification
  at sign-up.
- **The birth-date migration changes data**: it sets `birth_date` to NULL for players without a password whose birth
  date is within a day of their sign-up. Only Google sign-ups match that.
