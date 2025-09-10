import { RoundExtendedResponse } from "@/app/_interfaces/round";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type RoundState = {
  roundData: RoundExtendedResponse;
  resetRound: () => void;
  setRoundData: (data: RoundExtendedResponse) => void;
};

const useRoundStore = create<RoundState>()(
  persist(
    (set) => ({
      roundData: {
        team1_id: null,
        team2_id: null,
      },

      setRoundData: (data) => set((state) => ({roundData: {...state.roundData, ...data}})),

      resetRound: () => {
        set({
          roundData: null,
        });
      },
    }),
    {
      name: "round-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useRoundStore;
