import {create} from "zustand";


export type RoundState = {
    team1wins: number;
    team2wins: number;
    addMatch: ({player_pair1_total_points, player_pair2_total_points}: { player_pair1_total_points: number; player_pair2_total_points: number; }) => void;
    resetRound: () => void;
};

const useRoundStore = create<RoundState>((set) => ({
    matches: [],
    team1wins: 0,
    team2wins: 0,

    addMatch: ({player_pair1_total_points, player_pair2_total_points}) => {
        set((state) => ({
            team1wins: state.team1wins + (player_pair1_total_points > player_pair2_total_points ? 1 : 0),
            team2wins: state.team2wins + (player_pair2_total_points > player_pair1_total_points ? 1 : 0),
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
