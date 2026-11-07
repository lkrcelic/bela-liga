import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import {computeHandTotals, gamePointsError, sumAnnouncements} from "@/app/_lib/bela/scoring";

export class InvalidResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidResultError";
  }
}

export const BELA_ONLY_ERROR = "Ovaj turnir se igra bez zvanja: upisuje se samo bela (20).";
export const ONE_BELA_ERROR = "Bela se u igri zove samo jednom.";

// A table of a tournament "bez zvanja" (Round.declarations false) takes no zvanja but bela, the king and queen of
// trumps (20), which only one team can have in a hand. Null when the announcements are fine.
export function declarationsError(declarations: boolean, announcements: {announcement_type?: string}[] | undefined): string | null {
  if (declarations) return null;
  const list = announcements ?? [];
  if (list.some((a) => a.announcement_type !== "TWENTY")) return BELA_ONLY_ERROR;
  if (list.length > 1) return ONE_BELA_ERROR;
  return null;
}

// Checks a hand sent by the client and returns it with the announcement points, totals and pass flag
// recomputed on the server, so a buggy or tampered client can't store totals that don't follow the rules.
export function normalizeBelaResult(belaResult: BelaResultCreateRequest): BelaResultCreateRequest {
  const gameError = gamePointsError(
    belaResult.player_pair1_game_points,
    belaResult.player_pair2_game_points,
    belaResult.complete_victory,
  );
  if (gameError) {
    throw new InvalidResultError(gameError);
  }

  const announcements = belaResult.announcements ?? [];
  const announcementPoints1 = sumAnnouncements(announcements, 1);
  const announcementPoints2 = sumAnnouncements(announcements, 2);
  if (
    announcementPoints1 !== belaResult.player_pair1_announcement_points ||
    announcementPoints2 !== belaResult.player_pair2_announcement_points
  ) {
    throw new InvalidResultError("Bodovi zvanja ne odgovaraju upisanim zvanjima.");
  }

  const totals = computeHandTotals({
    gamePoints1: belaResult.player_pair1_game_points,
    gamePoints2: belaResult.player_pair2_game_points,
    announcementPoints1,
    announcementPoints2,
    trumpCaller: belaResult.trump_caller_team,
    completeVictory: belaResult.complete_victory,
  });

  return {
    ...belaResult,
    announcements,
    player_pair1_total_points: totals.totalPoints1,
    player_pair2_total_points: totals.totalPoints2,
    pass: totals.pass,
  };
}
