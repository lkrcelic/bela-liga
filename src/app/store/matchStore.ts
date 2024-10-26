import {create} from "zustand";
import {MatchResponse} from "@/app/lib/interfaces/match";
import {BelaResultRequest} from "@/app/lib/interfaces/belaResult";
import {PlayerPartialResponse} from "@/app/lib/interfaces/player";

export type MatchState = {
    matchData: MatchResponse;
    setMatchData: (data: MatchResponse) => void;
    addResult: (result: BelaResultRequest) => void;
    resetMatch: () => void;
    setSeatingOrder: (newOrder: (PlayerPartialResponse | null)[]) => void;
};

const useMatchStore = create<MatchState>((set) => ({
        matchData: {
            player_pair1_score: 0,
            player_pair2_score: 0,
            belaResults: [],
            seating_order: [null, null, null, null],
        },

        setSeatingOrder: (newOrder) => set((state) => ({
            matchData: {...state.matchData, seating_order: newOrder}
        })),

        setMatchData: (data: MatchResponse) => set((state) => ({
            matchData: {...state.matchData, ...data}
        })),


        addResult: (result) => {
            set((state) => ({
                ...state,
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
