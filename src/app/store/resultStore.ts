// src/store/scoreStore.ts
import {create} from "zustand";
import {PlayerAnnouncements} from "@/app/types/types";

type ResultState = {
    team1GamePoints: number;
    team2GamePoints: number;
    team1AnnouncementPoints: number;
    team2AnnouncementPoints: number;
    team1TotalPoints: number;
    team2TotalPoints: number;
    activeTeam: "team1" | "team2";
    trumpCallerId: number | null;
    stigljaActive: boolean;
    setTrumpCallerId: (playerId: number) => void;
    setActiveTeam: (team: "team1" | "team2") => void;
    updateScore: (digit: number) => void;
    resetScore: () => void;
    setStiglja: () => void;
    updateAnnouncementPoints: (playerAnnouncements: {
        [key: number]: PlayerAnnouncements;
    }) => void;
    resetResult: () => void;
};

const MAX_SCORE = 162;
const STIGLJA_SCORE = 252;

const initialState = {
    stigljaActive: false,
    team1GamePoints: 0,
    team2GamePoints: 0,
    team1AnnouncementPoints: 0,
    team2AnnouncementPoints: 0,
    team1TotalPoints: 0,
    team2TotalPoints: 0,
    trumpCallerId: null,
    activeTeam: "team1",
};

const useResultStore = create<ResultState>((set) => ({
        ...initialState,

        resetResult: () => set(initialState),

        setTrumpCallerId: (playerId) => set({trumpCallerId: playerId}),

        setActiveTeam: (team) => set({activeTeam: team}),

        updateScore: (digit: number) =>
            set((state) => {
                const {
                    activeTeam,
                    team1GamePoints,
                    team2GamePoints,
                    team1AnnouncementPoints,
                    team2AnnouncementPoints,
                    trumpCallerId,
                } = state;

                if (trumpCallerId === null) {
                    throw new Error("Trump caller ID is not set");
                }
                let newScore, team1UpdatedGamePoints, team2UpdatedGamePoints;
                const team1Called = trumpCallerId === 1 || trumpCallerId === 3;

                if (activeTeam === "team1") {
                    newScore = team1GamePoints * 10 + digit;
                    if (newScore > MAX_SCORE) {
                        return state;
                    }
                    team1UpdatedGamePoints = newScore;
                    team2UpdatedGamePoints = MAX_SCORE - newScore;
                }

                if (activeTeam === "team2") {
                    newScore = team2GamePoints * 10 + digit;
                    if (newScore > MAX_SCORE) {
                        return state;
                    }
                    team2UpdatedGamePoints = newScore;
                    team1UpdatedGamePoints = MAX_SCORE - newScore;
                }

                let updatedTeam1TotalPoints = team1UpdatedGamePoints + team1AnnouncementPoints;
                let updatedTeam2TotalPoints = team2UpdatedGamePoints + team2AnnouncementPoints;

                if (team1Called && updatedTeam1TotalPoints < updatedTeam2TotalPoints) {
                    updatedTeam1TotalPoints = 0;
                    updatedTeam2TotalPoints = MAX_SCORE + team2AnnouncementPoints + team1AnnouncementPoints;

                } else if (!team1Called && updatedTeam2TotalPoints < updatedTeam1TotalPoints) {
                    updatedTeam2TotalPoints = 0;
                    updatedTeam1TotalPoints = MAX_SCORE + team1AnnouncementPoints + team2AnnouncementPoints;
                }

                return {
                    team1GamePoints: team1UpdatedGamePoints,
                    team2GamePoints: team2UpdatedGamePoints,
                    team1TotalPoints: updatedTeam1TotalPoints,
                    team2TotalPoints: updatedTeam2TotalPoints,
                };
            }),

        resetScore: () =>
            set((state) => ({
                team1GamePoints: 0,
                team2GamePoints: 0,
                team1TotalPoints: state.team1AnnouncementPoints,
                team2TotalPoints: state.team2AnnouncementPoints,
                stigljaActive: false,
            })),

        setStiglja:
            () =>
                set((state) => {
                    const {
                        activeTeam,
                        team1AnnouncementPoints,
                        team2AnnouncementPoints,
                    } = state;
                    /*TODO Add check for trump caller*/
                    if (activeTeam === "team1") {
                        return {
                            stigljaActive: true,
                            team1GamePoints: STIGLJA_SCORE,
                            team2GamePoints: 0,
                            team1TotalPoints:
                                STIGLJA_SCORE + team1AnnouncementPoints + team2AnnouncementPoints,
                            team2TotalPoints: 0,
                        };
                    } else {
                        return {
                            stigljaActive: true,
                            team1GamePoints: 0,
                            team2GamePoints: STIGLJA_SCORE,
                            team1TotalPoints: 0,
                            team2TotalPoints:
                                STIGLJA_SCORE + team2AnnouncementPoints + team1AnnouncementPoints,
                        };
                    }
                }),

        updateAnnouncementPoints:
            (playerAnnouncements: {
                [key: number]: PlayerAnnouncements;
            }) => {
                const calculateTeamPoints = (playerIds) =>
                    playerIds.reduce(
                        (total, playerId) =>
                            total + playerAnnouncements[playerId].totalAnnouncements,
                        0
                    );

                const team1Players = [1, 3];
                const team2Players = [2, 4];

                const team1AnnouncementPoints = calculateTeamPoints(team1Players);
                const team2AnnouncementPoints = calculateTeamPoints(team2Players);

                set({
                    team1AnnouncementPoints,
                    team2AnnouncementPoints,
                });

                set((state) => ({
                    team1TotalPoints: state.team1GamePoints + state.team1AnnouncementPoints,
                    team2TotalPoints: state.team2GamePoints + state.team2AnnouncementPoints,
                }));
            },
    }))
;

export default useResultStore;
