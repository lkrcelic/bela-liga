import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ResultState} from "@/app/store/bela/resultStore";

export type MatchState = {
    results: ResultState[];
    player_pair1_total_points: number;
    player_pair2_total_points: number;
    playerPair1TotalAnnouncements: number;
    playerPair2TotalAnnouncements: number;
    addResult: (data: {
        playerPair1ResultPoints: number;
        playerPair2ResultPoints: number;
        playerPair1ResultAnnouncements: number;
        playerPair2ResultAnnouncements: number;
    }) => void;
    resetMatch: () => void;
};

const useMatchStore = create<MatchState>(
    persist((set) => ({
        results: [],
        player_pair1_total_points: 0,
        player_pair2_total_points: 0,
        playerPair1TotalAnnouncements: 0,
        playerPair2TotalAnnouncements: 0,

        addResult: ({
                        playerPair1ResultPoints,
                        playerPair2ResultPoints,
                        playerPair1ResultAnnouncements,
                        playerPair2ResultAnnouncements
                    }) => {
            set((state) => ({
                results: [
                    {
                        player_pair1_total_points: playerPair1ResultPoints,
                        player_pair2_total_points: playerPair2ResultPoints,
                        player_pair1_announcement_points: playerPair1ResultAnnouncements,
                        player_pair2_announcement_points: playerPair2ResultAnnouncements,
                    },
                    ...state.results,
                ],
                player_pair1_total_points: state.player_pair1_total_points + playerPair1ResultPoints,
                player_pair2_total_points: state.player_pair2_total_points + playerPair2ResultPoints,
                playerPair1TotalAnnouncements: state.playerPair1TotalAnnouncements + playerPair1ResultAnnouncements,
                playerPair2TotalAnnouncements: state.playerPair2TotalAnnouncements + playerPair2ResultAnnouncements,
            }));
        },

        resetMatch: () => set({
            results: [],
            team1Stiglas: 0,
            team2Stiglas: 0,
            team1Falls: 0,
            team2Falls: 0,
            player_pair1_total_points: 0,
            player_pair2_total_points: 0,
            playerPair1TotalAnnouncements: 0,
            playerPair2TotalAnnouncements: 0,
        }),


    }))
);

export default useMatchStore;
