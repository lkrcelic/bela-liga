// The player's open table on the pages that offer it (STOL n … Započni igru), #85.

// The table a tournament's page offers to play: the player's open table in this tournament, unless the tournament
// already says that table was decided without play (Pobjeda bez igre after Ne, nisu došli, or a skipped table). The
// page reads both on the same tick, but the open table can still have a table the answer just closed, and then the
// page would offer a table there is nothing to play at.
export function tableToPlay<T extends {roundId: number; tournamentId: number | null}>(
  open: T | null,
  tournamentId: number,
  lastDecided: {round_id: number} | null | undefined,
): T | null {
  if (!open || open.tournamentId !== tournamentId) return null;
  if (lastDecided && lastDecided.round_id === open.roundId) return null;
  return open;
}

// A read of the open table that failed without saying anything about the table: no connection (no status) or a server
// fault (5xx). The card already shown stays until the next read, so a dropped connection at the table doesn't take
// Započni igru away. An answer of the server (404: no open table; 401: logged out) is the truth, and the card goes.
export function readSaysNothing(error: unknown): boolean {
  const status = (error as {status?: unknown} | null)?.status;
  return typeof status !== "number" || status >= 500;
}
