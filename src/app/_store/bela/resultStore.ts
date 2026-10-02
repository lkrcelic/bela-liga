// src/store/scoreStore.ts
import {create} from "zustand";
import {BelaResultResponse} from "@/app/_interfaces/belaResult";
import {TeamsAnnouncements} from "@/app/_store/bela/announcementStore";
import {BelaPlayerAnnouncementsRequest, TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import {createJSONStorage, persist} from "zustand/middleware";
import {COMPLETE_VICTORY_POINTS, computeHandTotals, HAND_POINTS} from "@/app/_lib/bela/scoring";

type BelaResultTypeExtended = BelaResultResponse & {
  activeTeam: "team1" | "team2";
}

export type ResultState = {
  resultData: BelaResultTypeExtended;
  // the next digit starts a new number instead of being appended (after switching team or opening a saved hand)
  startNewNumber: boolean;
  setTrumpCallerTeam: (team: TeamSide) => void;
  setActiveTeam: (team: "team1" | "team2") => void;
  setTotalPoints: () => void;
  setGamePoints: (digit: number) => void;
  resetScore: () => void;
  setCompleteVictory: () => void;
  setMatchId: (id: number) => void;
  updateAnnouncementPoints: (teamsAnnouncements: TeamsAnnouncements) => void;
  resetResult: () => void;
  setResultData: (data: BelaResultResponse) => void;
};

const MAX_SCORE = HAND_POINTS;
const COMPLETE_VICTORY_SCORE = COMPLETE_VICTORY_POINTS;
const PrismaAnnouncementEnumValueMap = {
  20: "TWENTY",
  50: "FIFTY",
  100: "ONE_HUNDRED",
  150: "ONE_HUNDRED_FIFTY",
  200: "TWO_HUNDRED",
};

const initialState = {
  resultData: {
    complete_victory: false,
    player_pair1_game_points: 0,
    player_pair2_game_points: 0,
    player_pair1_announcement_points: 0,
    player_pair2_announcement_points: 0,
    player_pair1_total_points: 0,
    player_pair2_total_points: 0,
    trump_caller_team: null,
    activeTeam: "team1" as "team1" | "team2",
  }
};

const useResultStore = create<ResultState>()(persist<ResultState>((set) => ({
    ...initialState,
    startNewNumber: false,

    setResultData: (data: BelaResultResponse) => set((state) => ({
      resultData: {...state.resultData, ...data},
      startNewNumber: true,
    })),

    resetResult: () => set({resultData: {...initialState.resultData}, startNewNumber: false}),

    setTrumpCallerTeam: (team) => set((state) => ({
      resultData: {...state.resultData, trump_caller_team: team}
    })),

    setActiveTeam: (team) => set((state) => ({
      resultData: {...state.resultData, activeTeam: team},
      startNewNumber: true,
    })),

    setMatchId: (id) => set((state) => ({
      resultData: {...state.resultData, match_id: id}
    })),

    setGamePoints: (digit: number) => set((state) => {
      const {
        resultData: {
          activeTeam,
          player_pair1_game_points,
          player_pair2_game_points,
        },
        startNewNumber,
      } = state;
      let newScore, pp1UpdatedGamePoints, pp2UpdatedGamePoints;

      if (activeTeam === "team1") {
        newScore = (startNewNumber ? 0 : player_pair1_game_points) * 10 + digit;
        if (newScore > MAX_SCORE) {
          return state;
        }
        pp1UpdatedGamePoints = newScore;
        pp2UpdatedGamePoints = MAX_SCORE - newScore;
      }

      if (activeTeam === "team2") {
        newScore = (startNewNumber ? 0 : player_pair2_game_points) * 10 + digit;
        if (newScore > MAX_SCORE) {
          return state;
        }
        pp2UpdatedGamePoints = newScore;
        pp1UpdatedGamePoints = MAX_SCORE - newScore;
      }

      return {
        resultData: {
          ...state.resultData,
          player_pair1_game_points: pp1UpdatedGamePoints,
          player_pair2_game_points: pp2UpdatedGamePoints,
        },
        startNewNumber: false,
      };
    }),

    setTotalPoints: () => set((state) => {
      const {
        resultData: {
          player_pair1_game_points,
          player_pair2_game_points,
          player_pair1_announcement_points,
          player_pair2_announcement_points,
          trump_caller_team,
          complete_victory,
        }
      } = state;

      if (trump_caller_team !== 1 && trump_caller_team !== 2) {
        throw new Error("Trump caller team is not set");
      }

      const totals = computeHandTotals({
        gamePoints1: player_pair1_game_points,
        gamePoints2: player_pair2_game_points,
        announcementPoints1: player_pair1_announcement_points,
        announcementPoints2: player_pair2_announcement_points,
        trumpCaller: trump_caller_team,
        completeVictory: complete_victory,
      });

      return {
        resultData: {
          ...state.resultData,
          player_pair1_total_points: totals.totalPoints1,
          player_pair2_total_points: totals.totalPoints2,
          pass: totals.pass,
        }
      };
    }),

    resetScore:
      () =>
        set((state) => ({
          resultData: {
            ...state.resultData,
            player_pair1_game_points: 0,
            player_pair2_game_points: 0,
            player_pair1_total_points: state.resultData.player_pair1_announcement_points,
            player_pair2_total_points: state.resultData.player_pair2_announcement_points,
            complete_victory: false,
          }
        })),

    setCompleteVictory: () => set((state) => {
      const {
        resultData: {
          activeTeam,
          trump_caller_team,
        }
      } = state;
      if (trump_caller_team == null) {
        throw new Error("Trump caller team is not set");
      }

      if (activeTeam === "team1") {
        return {
          resultData: {
            ...state.resultData,
            complete_victory: true,
            player_pair1_game_points: COMPLETE_VICTORY_SCORE,
            player_pair2_game_points: 0,
          }
        };
      }
      if (activeTeam === "team2") {
        return {
          resultData: {
            ...state.resultData,
            complete_victory: true,
            player_pair1_game_points: 0,
            player_pair2_game_points: COMPLETE_VICTORY_SCORE,
          }
        };
      }
    }),

    updateAnnouncementPoints: (teamsAnnouncements: TeamsAnnouncements) => {
      const announcements: BelaPlayerAnnouncementsRequest[] = [];

      ([1, 2] as TeamSide[]).forEach((team) => {
        Object.entries(teamsAnnouncements[team]?.announcementCounts ?? {}).forEach(
          ([announcementTypeStr, count]) => {
            const announcementType = Number(announcementTypeStr);
            for (let i = 0; i < count; i++) {
              announcements.push({
                team: team,
                announcement_type: PrismaAnnouncementEnumValueMap[announcementType],
              });
            }
          }
        );
      });

      set((state) => {
        const updatedPP1AnnouncementPoints = teamsAnnouncements[1]?.totalAnnouncements || 0;
        const updatedPP2AnnouncementPoints = teamsAnnouncements[2]?.totalAnnouncements || 0;

        const updatedPP1TotalPoints =
          state.resultData.player_pair1_game_points + updatedPP1AnnouncementPoints;
        const updatedPP2TotalPoints =
          state.resultData.player_pair2_game_points + updatedPP2AnnouncementPoints;

        return {
          resultData: {
            ...state.resultData,
            player_pair1_announcement_points: updatedPP1AnnouncementPoints,
            player_pair2_announcement_points: updatedPP2AnnouncementPoints,
            player_pair1_total_points: updatedPP1TotalPoints,
            player_pair2_total_points: updatedPP2TotalPoints,
            announcements: announcements,
          },
        };
      });
    },
  }), {
    name: 'result-store',
    storage: createJSONStorage(() => localStorage),
  }));

export default useResultStore;
