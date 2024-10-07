import {create} from "zustand";


export type RoundState = {
    team1wins: number;
    team2wins: number;
    addMatch: ({team1TotalPoints, team2TotalPoints}: { team1TotalPoints: number; team2TotalPoints: number; }) => void;
    resetRound: () => void;
};

const useRoundStore = create<RoundState>((set) => ({
    matches: [],
    team1wins: 0,
    team2wins: 0,

    addMatch: ({team1TotalPoints, team2TotalPoints}) => {
        set((state) => ({
            team1wins: state.team1wins + (team1TotalPoints > team2TotalPoints ? 1 : 0),
            team2wins: state.team2wins + (team2TotalPoints > team1TotalPoints ? 1 : 0),
        }));
    },

    resetRound: () => {
        set({
            matches: [],
            team1wins: 0,
            team2wins: 0,
        });
    }
}), {
    name: 'round-store',
    storage: localStorage, // Use sessionStorage instead of localStorage
    partialize: (state) => ({
        team1wins: state.team1wins,
        team2wins: state.team2wins,
    }),
});

export default useRoundStore;
