import {create} from "zustand";
import {BelaResult} from "@prisma/client";

type MatchState = {
    results: BelaResult[];
    team1Stiglas: number;
    team2Stiglas: number;
    team1Falls: number;
    team2Falls: number;
    team1TotalPoints: number;
    team2TotalPoints: number;
    team1TotalAnnouncements: number;
    team2TotalAnnouncements: number;
    addResult: (data: { stigljaActive: boolean; team1TotalPoints: number; team2TotalPoints: number; team1AnnouncementPoints: number; team2AnnouncementPoints: number; }) => void;
    resetMatch: () => void;
};

const useMatchStore = create<MatchState>((set) => ({
    results: [],
    team1Stiglas: 0,
    team2Stiglas: 0,
    team1Falls: 0,
    team2Falls: 0,
    team1TotalPoints: 0,
    team2TotalPoints: 0,
    team1TotalAnnouncements: 0,
    team2TotalAnnouncements: 0,


    addResult: ({ stigljaActive, team1TotalPoints, team2TotalPoints, team1AnnouncementPoints, team2AnnouncementPoints }) => {
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
            team1TotalPoints: state.team1TotalPoints + team1TotalPoints,
            team2TotalPoints: state.team2TotalPoints + team2TotalPoints,
            team1TotalAnnouncements: state.team1TotalAnnouncements + team1AnnouncementPoints,
            team2TotalAnnouncements: state.team2TotalAnnouncements + team2AnnouncementPoints,
            team1Stiglas: stigljaActive && team1Won ? state.team1Stiglas + 1 : state.team1Stiglas,
            team2Stiglas: stigljaActive && team2Won ? state.team2Stiglas + 1 : state.team2Stiglas,
            team1Falls: team2Won && !stigljaActive ? state.team1Falls + 1 : state.team1Falls,
            team2Falls: team1Won && !stigljaActive ? state.team2Falls + 1 : state.team2Falls,
        }));
    },

    resetMatch: () => set({
        team1Stiglas: 0,
        team2Stiglas: 0,
        team1Falls: 0,
        team2Falls: 0,
        team1TotalPoints: 0,
        team2TotalPoints: 0,
        team1TotalAnnouncements: 0,
        team2TotalAnnouncements: 0,
    }),
}));


export default useMatchStore;
