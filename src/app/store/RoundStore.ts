import {create} from "zustand";
import {RoundType} from "@/app/lib/interfaces/round";

export type RoundState = {
    roundData: RoundType;
    resetRound: () => void;
    setRoundData: (data: RoundType) => void;
};

const useRoundStore = create<RoundState>((set) => ({
    roundData: {
        round_number: 1, //TODO remove hard coded
        round_date: new Date('2024-01-01'), //TODO remove hard coded
        team1_id: null,
        team2_id: null,
    },

    setRoundData: (data) => set((state) => ({roundData: {...state.roundData, ...data}})),

    resetRound: () => {
        set({
            roundData: null
        });
    }
}));

export default useRoundStore;
