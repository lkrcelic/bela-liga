import "./memoryStorage";
import {TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import {BelaResultCreateRequest} from "@/app/_interfaces/belaResult";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";

// Enters one hand through the stores the way the scoreboard screens do, and returns the request saveHand would send:
//   trump caller step  -> setTrumpCallerTeam
//   zvanja step        -> setAnnouncement per announcement
//   score step         -> setActiveTeam + one keypad digit at a time (or Štiglja)
//   save               -> updateAnnouncementPoints + setTotalPoints
export type HandPlan = {
  caller: TeamSide;
  // the team whose game points are typed on the keypad, and what is typed ("92" types 9 then 2)
  typedFor?: TeamSide;
  typed?: string;
  // Štiglja for this team instead of typing points
  stiglja?: TeamSide;
  announcements?: {team: TeamSide; points: 20 | 50 | 100 | 150 | 200}[];
};

export function resetHand() {
  useResultStore.getState().resetResult();
  useAnnouncementStore.getState().resetAnnouncements();
}

export function enterHand(matchId: number, plan: HandPlan): BelaResultCreateRequest {
  resetHand();
  const result = useResultStore.getState();
  result.setMatchId(matchId);
  result.setTrumpCallerTeam(plan.caller);

  for (const a of plan.announcements ?? []) {
    useAnnouncementStore.getState().setAnnouncement(a.team, a.points);
  }

  if (plan.stiglja) {
    useResultStore.getState().setActiveTeam(plan.stiglja === 1 ? "team1" : "team2");
    useResultStore.getState().setCompleteVictory();
  } else {
    const side = plan.typedFor ?? plan.caller;
    useResultStore.getState().setActiveTeam(side === 1 ? "team1" : "team2");
    for (const digit of plan.typed ?? "") {
      useResultStore.getState().setGamePoints(Number(digit));
    }
  }

  // what saveHand does before sending
  useResultStore.getState().updateAnnouncementPoints(useAnnouncementStore.getState().teamsAnnouncements);
  useResultStore.getState().setTotalPoints();
  return {...useResultStore.getState().resultData, match_id: matchId} as BelaResultCreateRequest;
}
