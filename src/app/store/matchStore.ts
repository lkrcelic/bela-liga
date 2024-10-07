import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ResultState} from "@/app/store/bela/resultStore";

export type MatchState = {
    results: ResultState[];
    playerPair1TotalPoints: number;
    playerPair2TotalPoints: number;
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
        playerPair1TotalPoints: 0,
        playerPair2TotalPoints: 0,
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
                        team1TotalPoints: playerPair1ResultPoints,
                        team2TotalPoints: playerPair2ResultPoints,
                        player_pair1_announcement_points: playerPair1ResultAnnouncements,
                        player_pair2_announcement_points: playerPair2ResultAnnouncements,
                    },
                    ...state.results,
                ],
                playerPair1TotalPoints: state.playerPair1TotalPoints + playerPair1ResultPoints,
                playerPair2TotalPoints: state.playerPair2TotalPoints + playerPair2ResultPoints,
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
            playerPair1TotalPoints: 0,
            playerPair2TotalPoints: 0,
            playerPair1TotalAnnouncements: 0,
            playerPair2TotalAnnouncements: 0,
        }),


    }))
);

export default useMatchStore;
