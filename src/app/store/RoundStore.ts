import {create} from "zustand";


export type RoundState = {
    team1wins: number;
    team2wins: number;
    addMatch: ({playerPair1TotalPoints, playerPair2TotalPoints}: { playerPair1TotalPoints: number; playerPair2TotalPoints: number; }) => void;
    resetRound: () => void;
};

const useRoundStore = create<RoundState>((set) => ({
    matches: [],
    team1wins: 0,
    team2wins: 0,

    addMatch: ({playerPair1TotalPoints, playerPair2TotalPoints}) => {
        set((state) => ({
            team1wins: state.team1wins + (playerPair1TotalPoints > playerPair2TotalPoints ? 1 : 0),
            team2wins: state.team2wins + (playerPair2TotalPoints > playerPair1TotalPoints ? 1 : 0),
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
    storage: sessionStorage, // Use sessionStorage instead of sessionStorage
    partialize: (state) => ({
        team1wins: state.team1wins,
        team2wins: state.team2wins,
    }),
});

export default useRoundStore;
