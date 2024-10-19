import {create} from "zustand";
import {MatchType} from "@/app/lib/interfaces/match";
import {BelaResultType} from "@/app/lib/interfaces/belaResult";
import {RoundType} from "@/app/lib/interfaces/round";

export type MatchState = {
    matchData: MatchType;
    setMatchData: (data: MatchType) => void;
    addResult: (result: BelaResultType) => void;
    resetMatch: () => void;
};

const useMatchStore = create<MatchState>((set) => ({
        matchData: {
            player_pair1_score: 0,
            player_pair2_score: 0,
            belaResults: [],
        },

        setMatchData: (data: MatchType) => set({matchData: data}),

        addResult: (result) => {
            set((state) => ({
                matchData: {
                    ...state.matchData,
                    player_pair1_score: state.matchData?.player_pair1_score + result.player_pair1_total_points,
                    player_pair2_score: state.matchData?.player_pair2_score + result.player_pair2_total_points,
                    belaResults: [result, ...(state.matchData?.belaResults || [])],
                },
            }));
        },

        resetMatch: () => set({
            matchData: {
                player_pair1_score: 0,
                player_pair2_score: 0,
                belaResults: [],
            },
        }),
    })
);

export default useMatchStore;
