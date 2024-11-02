import {create} from "zustand";
import {OngoingMatchResponse} from "@/app/interfaces/match";
import {PlayerPartialResponse} from "@/app/interfaces/player";

export type OngoingMatchState = {
    ongoingMatch: OngoingMatchResponse;
    setOngoingMatch: (data: OngoingMatchResponse) => void;
    resetOngoingMatch: () => void;
    setSeatingOrder: (newOrder: (PlayerPartialResponse | null)[]) => void;
    createOngoingMatch: (round_id: number) => Promise<number>;
};

const useOngoingMatchStore = create<OngoingMatchState>((set) => ({
        ongoingMatch: {
            player_pair1_score: 0,
            player_pair2_score: 0,
            current_shuffler_index: 0,
            belaResults: [],
            seating_order: [null, null, null, null],
        },

        setSeatingOrder: (newOrder) => set((state) => ({
            ongoingMatch: {...state.ongoingMatch, seating_order: newOrder}
        })),

        setOngoingMatch: (data: OngoingMatchResponse) => set((state) => ({
            ongoingMatch: {...state.ongoingMatch, ...data}
        })),

        resetOngoingMatch: () => set((state) => ({
            ongoingMatch: {
                seating_order: state.ongoingMatch.seating_order || [null, null, null, null],
                player_pair1_score: 0,
                player_pair2_score: 0,
                belaResults: [],
                current_shuffler_index: state.current_shuffler_index || 0,
            },
        })),
    })
);

export default useOngoingMatchStore;
