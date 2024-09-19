import { create } from "zustand";

type ScoreState = {
  team1Score: number;
  team2Score: number;
  activeTeam: "team1" | "team2" | null;
  setActiveTeam: (team: "team1" | "team2") => void;
  updateScore: (digit: number) => void;
  deleteLastDigit: () => void;
  resetScore: () => void;
};

const useScoreStore = create<ScoreState>((set) => ({
  team1Score: 0,
  team2Score: 0,
  activeTeam: null,

  setActiveTeam: (team) => set({ activeTeam: team }),

  updateScore: (digit) =>
    set((state) => {
      if (state.activeTeam === "team1") {
        return {
          team1Score: state.team1Score * 10 + digit, // Shift digits and append the new digit
        };
      } else if (state.activeTeam === "team2") {
        return {
          team2Score: state.team2Score * 10 + digit, // Shift digits and append the new digit
        };
      }
      return {};
    }),

  deleteLastDigit: () =>
    set((state) => {
      if (state.activeTeam === "team1") {
        return { team1Score: Math.floor(state.team1Score / 10) }; // Remove the last digit
      } else if (state.activeTeam === "team2") {
        return { team2Score: Math.floor(state.team2Score / 10) }; // Remove the last digit
      }
      return {};
    }),

  resetScore: () => set({ team1Score: 0, team2Score: 0 }),
}));

export default useScoreStore;
