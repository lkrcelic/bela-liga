// Bela hand scoring rules, shared by the result store (what the players see) and the API (what gets saved).
// Keep this file free of framework imports so it can be used on both sides and tested on its own.

export const HAND_POINTS = 162;
export const COMPLETE_VICTORY_POINTS = 252;

export const ANNOUNCEMENT_POINTS = {
  TWENTY: 20,
  FIFTY: 50,
  ONE_HUNDRED: 100,
  ONE_HUNDRED_FIFTY: 150,
  TWO_HUNDRED: 200,
} as const;

export type AnnouncementName = keyof typeof ANNOUNCEMENT_POINTS;
export type Side = 1 | 2;

export type HandInput = {
  gamePoints1: number;
  gamePoints2: number;
  announcementPoints1: number;
  announcementPoints2: number;
  trumpCaller: Side;
  completeVictory: boolean;
};

export type HandTotals = {
  totalPoints1: number;
  totalPoints2: number;
  // false when the calling team failed its contract (pad)
  pass: boolean;
};

export function computeHandTotals(hand: HandInput): HandTotals {
  const allAnnouncements = hand.announcementPoints1 + hand.announcementPoints2;

  if (hand.completeVictory) {
    // Štiglja: the team that took every trick gets 252 plus all announcements
    if (hand.gamePoints1 === COMPLETE_VICTORY_POINTS) {
      return {totalPoints1: COMPLETE_VICTORY_POINTS + allAnnouncements, totalPoints2: 0, pass: true};
    }
    return {totalPoints1: 0, totalPoints2: COMPLETE_VICTORY_POINTS + allAnnouncements, pass: true};
  }

  const total1 = hand.gamePoints1 + hand.announcementPoints1;
  const total2 = hand.gamePoints2 + hand.announcementPoints2;

  // Pad: the calling team must score more than the other team, otherwise the other team takes everything
  if (hand.trumpCaller === 1 && total1 <= total2) {
    return {totalPoints1: 0, totalPoints2: HAND_POINTS + allAnnouncements, pass: false};
  }
  if (hand.trumpCaller === 2 && total2 <= total1) {
    return {totalPoints1: HAND_POINTS + allAnnouncements, totalPoints2: 0, pass: false};
  }
  return {totalPoints1: total1, totalPoints2: total2, pass: true};
}

export function sumAnnouncements(announcements: {team?: Side; announcement_type?: AnnouncementName}[], team: Side): number {
  return announcements
    .filter((a) => a.team === team)
    .reduce((sum, a) => sum + ANNOUNCEMENT_POINTS[a.announcement_type], 0);
}

// Returns a reason the game points can't be right, or null when they are fine.
export function gamePointsError(gamePoints1: number, gamePoints2: number, completeVictory: boolean): string | null {
  if (completeVictory) {
    const oneSideTookAll =
      (gamePoints1 === COMPLETE_VICTORY_POINTS && gamePoints2 === 0) ||
      (gamePoints2 === COMPLETE_VICTORY_POINTS && gamePoints1 === 0);
    return oneSideTookAll ? null : `A complete victory must be ${COMPLETE_VICTORY_POINTS} to 0.`;
  }
  if (gamePoints1 < 0 || gamePoints2 < 0) {
    return "Game points can't be negative.";
  }
  if (gamePoints1 + gamePoints2 !== HAND_POINTS) {
    return `Game points must add up to ${HAND_POINTS}.`;
  }
  return null;
}

// A match is over once a team reaches the threshold and the two scores differ.
export function matchWinner(score1: number, score2: number, threshold: number): Side | null {
  if (score1 === score2) return null;
  if (score1 < threshold && score2 < threshold) return null;
  return score1 > score2 ? 1 : 2;
}
