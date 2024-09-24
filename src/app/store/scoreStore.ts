import { create } from "zustand";

type ScoreState = {
  team1Score: number;
  team2Score: number;
  activeTeam: "team1" | "team2";
  stigljaActive: boolean;
  setActiveTeam: (team: "team1" | "team2") => void;
  updateScore: (digit: number) => void;
  resetScore: () => void;
  setStiglja: () => void;
};

const MAX_SCORE = 162;
const STIGLJA_SCORE = 252;

const useScoreStore = create<ScoreState>((set) => ({
  team1Score: 0,
  team2Score: 0,
  activeTeam: "team1",
  stigljaActive: false,

  setActiveTeam: (team) => set({ activeTeam: team }),

  updateScore: (digit) =>
    set((state) => {
      const { activeTeam, team1Score, team2Score } = state;
      let newScore;

      if (activeTeam === "team1") {
        newScore = team1Score * 10 + digit;
        if (newScore > MAX_SCORE) {
          return {};
        }
        return {
          team1Score: newScore,
          team2Score: MAX_SCORE - newScore,
        };
      }

      if (activeTeam === "team2") {
        newScore = team2Score * 10 + digit;
        if (newScore > MAX_SCORE) {
          return {};
        }
        return {
          team2Score: newScore,
          team1Score: MAX_SCORE - newScore,
        };
      }
    }),

  resetScore: () => set({ team1Score: 0, team2Score: 0, stigljaActive: false }),

  setStiglja: () =>
    set((state) => {
      const { activeTeam } = state;
      if (activeTeam === "team1") {
        return {
          stigljaActive: true,
          team1Score: STIGLJA_SCORE,
          team2Score: 0,
        };
      } else {
        return {
          stigljaActive: true,
          team1Score: 0,
          team2Score: STIGLJA_SCORE,
        };
      }
    }),
}));

export default useScoreStore;
