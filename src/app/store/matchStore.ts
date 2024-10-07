import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ResultState} from "@/app/store/bela/resultStore";

export type MatchState = {
    results: ResultState[];
    team1Stiglas: number;
    team2Stiglas: number;
    team1Falls: number;
    team2Falls: number;
    team1TotalPoints: number;
    team2TotalPoints: number;
    team1TotalAnnouncements: number;
    team2TotalAnnouncements: number;
    addResult: (data: {
        stigljaActive: boolean;
        team1TotalPoints: number;
        team2TotalPoints: number;
        team1AnnouncementPoints: number;
        team2AnnouncementPoints: number;
    }) => void;
    resetMatch: () => void;
};

const useMatchStore = create<MatchState>(
    persist((set) => ({
        results: [],
        team1Stiglas: 0,
        team2Stiglas: 0,
        team1Falls: 0,
        team2Falls: 0,
        team1TotalPoints: 0,
        team2TotalPoints: 0,
        team1TotalAnnouncements: 0,
        team2TotalAnnouncements: 0,

        addResult: ({
                        stigljaActive,
                        team1TotalPoints,
                        team2TotalPoints,
                        team1AnnouncementPoints,
                        team2AnnouncementPoints
                    }) => {
            const team1Won = team1TotalPoints > team2TotalPoints;
            const team2Won = team2TotalPoints > team1TotalPoints;

            set((state) => ({
                results: [
                    {
                        team1Points: team1TotalPoints,
                        team2Points: team2TotalPoints,
                        team1Announcements: team1AnnouncementPoints,
                        team2Announcements: team2AnnouncementPoints,
                    },
                    ...state.results,
                ],
                playerPair1TotalPoints: state.playerPair1TotalPoints + team1TotalPoints,
                playerPair2TotalPoints: state.playerPair2TotalPoints + team2TotalPoints,
                team1TotalAnnouncements: state.team1TotalAnnouncements + team1AnnouncementPoints,
                team2TotalAnnouncements: state.team2TotalAnnouncements + team2AnnouncementPoints,
                team1Stiglas: stigljaActive && team1Won ? state.team1Stiglas + 1 : state.team1Stiglas,
                team2Stiglas: stigljaActive && team2Won ? state.team2Stiglas + 1 : state.team2Stiglas,
                team1Falls: team2Won && !stigljaActive ? state.team1Falls + 1 : state.team1Falls,
                team2Falls: team1Won && !stigljaActive ? state.team2Falls + 1 : state.team2Falls,
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
            team1TotalAnnouncements: 0,
            team2TotalAnnouncements: 0,
        }),


    })),
    {
        name: 'match-store',
        storage: sessionStorage, // Use sessionStorage instead of sessionStorage
        partialize: (state) => ({
            results: state.results,
            team1Stiglas: state.team1Stiglas,
            team2Stiglas: state.team2Stiglas,
            team1Falls: state.team1Falls,
            team2Falls: state.team2Falls,
            playerPair1TotalPoints: state.playerPair1TotalPoints,
            playerPair2TotalPoints: state.playerPair2TotalPoints,
            team1TotalAnnouncements: state.team1TotalAnnouncements,
            team2TotalAnnouncements: state.team2TotalAnnouncements,
        }),
    });

export default useMatchStore;
