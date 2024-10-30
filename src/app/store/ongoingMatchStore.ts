import {create} from "zustand";
import {OngoingMatchResponse} from "@/app/lib/interfaces/match";
import {PlayerPartialResponse} from "@/app/lib/interfaces/player";

export type OngoingMatchState = {
    ongoingMatch: OngoingMatchResponse;
    setOngoingMatch: (data: OngoingMatchResponse) => void;
    resetMatch: () => void;
    setSeatingOrder: (newOrder: (PlayerPartialResponse | null)[]) => void;
};

const useOngoingMatchStore = create<OngoingMatchState>((set) => ({
        ongoingMatch: {
            player_pair1_score: 0,
            player_pair2_score: 0,
            belaResults: [],
            seating_order: [null, null, null, null],
        },

        setSeatingOrder: (newOrder) => set((state) => ({
            ongoingMatch: {...state.ongoingMatch, seating_order: newOrder}
        })),

        setOngoingMatch: (data: OngoingMatchResponse) => set((state) => ({
            ongoingMatch: {...state.ongoingMatch, ...data}
        })),

        resetMatch: () => set((state) => ({
            ongoingMatch: {
                seating_order: state.ongoingMatch.seating_order || [null, null, null, null],
                player_pair1_score: 0,
                player_pair2_score: 0,
                belaResults: [],
            },
        })),
    })
);

export default useOngoingMatchStore;
