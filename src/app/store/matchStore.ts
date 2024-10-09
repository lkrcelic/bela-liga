import {create} from "zustand";
import {persist} from "zustand/middleware";
import {MatchType} from "@/app/lib/interfaces/match";
import {BelaResultType} from "@/app/lib/interfaces/belaResult";

export type MatchState = MatchType & {
    results: BelaResultType[];
    player_pair1_score: number;
    player_pair2_score: number;
    playerPair1TotalAnnouncements: number;
    playerPair2TotalAnnouncements: number;
    addResult: (result: BelaResultType) => void;
    resetMatch: () => void;
};

const useMatchStore = create<MatchState>(
    persist((set) => ({
        results: [],
        player_pair1_score: 0,
        player_pair2_score: 0,
        playerPair1TotalAnnouncements: 0,
        playerPair2TotalAnnouncements: 0,

        addResult: (result) => {
            set((state) => ({
                results: [
                    result,
                    ...state.results,
                ],
                player_pair1_score: state.player_pair1_score + result.player_pair1_total_points,
                player_pair2_score: state.player_pair2_score + result.player_pair2_total_points,
                playerPair1TotalAnnouncements: state.playerPair1TotalAnnouncements + result.player_pair1_announcement_points,
                playerPair2TotalAnnouncements: state.playerPair2TotalAnnouncements + result.player_pair2_announcement_points,
            }));
        },

        resetMatch: () => set({
            results: [],
            team1Stiglas: 0,
            team2Stiglas: 0,
            team1Falls: 0,
            team2Falls: 0,
            player_pair1_score: 0,
            player_pair2_score: 0,
            playerPair1TotalAnnouncements: 0,
            playerPair2TotalAnnouncements: 0,
        }),


    }))
);

export default useMatchStore;
