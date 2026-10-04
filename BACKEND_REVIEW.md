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

## For you to decide

Each item has what happens now, the options, and what I would pick.

### A. Sessions end after 4 hours, even mid-evening
Both login types (password and Google) create sessions that expire 4 h after login. Lucia extends the session in the
database while it's used, but the browser cookie keeps its original 4 h expiry and is never re-issued, so a player
who logged in at 18:00 is logged out at 22:00 in the middle of a match.
- Options: (1) longer sessions, e.g. 7 days; (2) re-issue the cookie when Lucia extends the session (needs the
  signed cookie to be re-signed in a route or the middleware); (3) keep 4 h.
- I'd pick (1) + (2): long-lived and sliding.

### B. `GET /api/rounds?open=true` filters on `active`, not `open`
`open` = the round is not finished; `active` = a match is being played right now. The parameter name says one thing,
the query does the other. Nothing in the app uses the parameter today.
- Options: make `open` filter `open` and add an `active` parameter; or rename the parameter to `active`.
- I'd pick: `open` filters `open`, add `active`.

### C. League standings only list teams that have finished a round
The season table reads `TeamScore`, which gets a row the first time a team finishes a round. A new team, or a team just
added to the league, is missing from the standings until then (and on the first night everyone is missing).
- Options: list every team of the league with zeros; or keep it as is.
- I'd pick: list every team (inactive teams too, since they "stay in the league and its standings").

### D. Inactive teams are only left out by the client
Create Round leaves inactive teams out, but `POST /api/rounds/generate-multiple` accepts any team of the league.
- Options: the server drops (or refuses) inactive teams; or keep it client-side so an admin can still include an
  inactive team on purpose (the UI doesn't allow that today).
- I'd pick: the server drops them, matching the UI.

### E. A bye counts as two matches won 301:0
A team without an opponent gets the round 2:0 and two matches of 301:0, so +602 point difference per bye. Teams that
get a bye gain a lot on the tiebreaker.
- Options: keep; 0:0 matches (bye counts as a win but doesn't move the difference); or the team's average.
- Your call — it's a league rule.

### F. Ratings change for the whole roster
After a round, every player of both teams (substitutes included) gets the rating change, not only the two who played.
The app doesn't record who played.
- Options: keep; or record the two players per match and rate only them.

### G. Email matching is case-sensitive for Google sign-in
Someone who signed up as `Marko@Gmail.com` and then uses Google (which reports `marko@gmail.com`) gets a second
account instead of logging in, because the email lookup is exact. New Google users also get today as their birth date.
- Options: match emails case-insensitively and link the Google account to the existing player; ask for the birth date
  after the first Google login.

### H. Login attempts include successful ones
The login limit (5 per 5 minutes per address + username) counts every attempt, so five quick successful logins (e.g.
the same player on several devices) lock that username out for a few minutes.
- Options: count only failed attempts.
- I'd pick that.

### I. The middleware trusts any signed cookie
Pages check only that the session cookie is signed, not that the session still exists (the client now sends a dead
session to the login page). Already listed in BLOCKERS.md.
- Options: validate the session in the middleware (one database lookup per page load) or keep the client-side check.
