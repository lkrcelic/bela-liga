import {create} from "zustand";
import {RoundType} from "@/app/lib/interfaces/round";

type RoundTypeExtended = RoundType & {
    team1wins: number;
    team2wins: number;
}

export type RoundState = {
    roundData: RoundTypeExtended | null;
    addMatch: ({player_pair1_score, player_pair2_score}: {
        player_pair1_score: number;
        player_pair2_score: number;
    }) => void;
    resetRound: () => void;
    setRoundData: (data: RoundType) => void;
};

const useRoundStore = create<RoundState>((set) => ({
    roundData: {
        round_number: 1, //TODO remove hard coded
        round_date: new Date('2024-01-01'), //TODO remove hard coded
        team1_id: null,
        team2_id: null,
        team1wins: 0,
        team2wins: 0,
    },

    setRoundData: (data) => set((state) => ({ roundData: {...state.roundData, ...data} })),

    addMatch: ({player_pair1_score, player_pair2_score}) => {
        set((state) => ({
            roundData: {
                team1wins: state.roundData.team1wins + (player_pair1_score > player_pair2_score ? 1 : 0),
                team2wins: state.roundData.team2wins + (player_pair2_score > player_pair1_score ? 1 : 0),
            }
        }));
    },

    resetRound: () => {
        set({
            roundData: null
        });
    }
}));

export default useRoundStore;
