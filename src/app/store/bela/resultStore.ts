// src/store/scoreStore.ts
import {create} from "zustand";
import {PlayerAnnouncements} from "@/app/types/types";
import {BelaResultRequest} from "@/app/lib/interfaces/belaResult";

type BelaResultTypeExtended = BelaResultRequest & {
    activeTeam: "team1" | "team2";
}

export type ResultState = {
    resultData: BelaResultTypeExtended;
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
    resultData: {
        complete_victory: false,
        player_pair1_game_points: 0,
        player_pair2_game_points: 0,
        player_pair1_announcement_points: 0,
        player_pair2_announcement_points: 0,
        card_shuffler_id: 1,  //TODO: Remove this hardcoded 1
        trumpCallerPosition: null,
        player_pair1_total_points: 0,
        player_pair2_total_points: 0,
        trump_caller_id: 1, //TODO: Remove this hardcoded 1
        pass: true, //TODO think about this is this needed (if added total points)
        activeTeam: "team1",
    }
};

const useResultStore = create<ResultState>((set) => ({
    ...initialState,

    resetResult: () => set({resultData: {...initialState.resultData}}),

    setTrumpCallerId: (playerId) => set((state) => ({
        resultData: {...state.resultData, trump_caller_id: playerId}
    })),

    setActiveTeam: (team) => set((state) => ({
        resultData: {...state.resultData, activeTeam: team}
    })),

    updateScore: (digit: number) =>
        set((state) => {
            const {
                resultData: {
                    activeTeam,
                    player_pair1_game_points,
                    player_pair2_game_points,
                    player_pair1_announcement_points,
                    player_pair2_announcement_points,
                    trump_caller_id,
                }
            } = state;

            if (trump_caller_id === null) {
                throw new Error("Trump caller ID is not set");
            }
            let newScore, pp1UpdatedGamePoints, pp2UpdatedGamePoints;
            const team1Called = trump_caller_id === 1 || trump_caller_id === 3;

            if (activeTeam === "team1") {
                newScore = player_pair1_game_points * 10 + digit;
                if (newScore > MAX_SCORE) {
                    return state;
                }
                pp1UpdatedGamePoints = newScore;
                pp2UpdatedGamePoints = MAX_SCORE - newScore;
            }

            if (activeTeam === "team2") {
                newScore = player_pair2_game_points * 10 + digit;
                if (newScore > MAX_SCORE) {
                    return state;
                }
                pp2UpdatedGamePoints = newScore;
                pp1UpdatedGamePoints = MAX_SCORE - newScore;
            }

            let updatedPP1TotalPoints = pp1UpdatedGamePoints + player_pair1_announcement_points;
            let updatedPP2TotalPoints = pp2UpdatedGamePoints + player_pair2_announcement_points;

            if (team1Called && updatedPP1TotalPoints <= updatedPP2TotalPoints) {
                updatedPP1TotalPoints = 0;
                updatedPP2TotalPoints = MAX_SCORE + player_pair2_announcement_points + player_pair1_announcement_points;
            } else if (!team1Called && updatedPP2TotalPoints <= updatedPP1TotalPoints) {
                updatedPP2TotalPoints = 0;
                updatedPP1TotalPoints = MAX_SCORE + player_pair1_announcement_points + player_pair2_announcement_points;
            }

            return {
                resultData: {
                    ...state.resultData,
                    player_pair1_game_points: pp1UpdatedGamePoints,
                    player_pair2_game_points: pp2UpdatedGamePoints,
                    player_pair1_total_points: updatedPP1TotalPoints,
                    player_pair2_total_points: updatedPP2TotalPoints,
                }
            };
        }),

    resetScore: () =>
        set((state) => ({
            resultData: {
                ...state.resultData,
                player_pair1_game_points: 0,
                player_pair2_game_points: 0,
                player_pair1_total_points: state.resultData.player_pair1_announcement_points,
                player_pair2_total_points: state.resultData.player_pair2_announcement_points,
                complete_victory: false,
            }
        })),

    setStiglja: () =>
        set((state) => {
            const {
                resultData: {
                    activeTeam,
                    player_pair1_announcement_points,
                    player_pair2_announcement_points,
                }
            } = state;
            /*TODO Add check for trump caller*/
            if (activeTeam === "team1") {
                return {
                    resultData: {
                        ...state.resultData,
                        complete_victory: true,
                        player_pair1_game_points: STIGLJA_SCORE,
                        player_pair2_game_points: 0,
                        player_pair1_total_points:
                            STIGLJA_SCORE + player_pair1_announcement_points + player_pair2_announcement_points,
                        player_pair2_total_points: 0,
                    }
                };
            } else {
                return {
                    resultData: {
                        ...state.resultData,
                        complete_victory: true,
                        player_pair1_game_points: 0,
                        player_pair2_game_points: STIGLJA_SCORE,
                        player_pair1_total_points: 0,
                        player_pair2_total_points:
                            STIGLJA_SCORE + player_pair2_announcement_points + player_pair1_announcement_points,
                    }
                };
            }
        }),

    updateAnnouncementPoints: (playerAnnouncements: { [key: number]: PlayerAnnouncements; }) => {
        const calculateTeamPoints = (playerIds) =>
            playerIds.reduce(
                (total, playerId) => total + (playerAnnouncements[playerId]?.totalAnnouncements || 0),
                0
            );

        const team1Players = [1, 2];
        const team2Players = [3, 4];

        const updatedPP1AnnouncementPoints = calculateTeamPoints(team1Players);
        const updatedPP2AnnouncementPoints = calculateTeamPoints(team2Players);

        set((state) => {
            const updatedPP1TotalPoints = state.resultData.player_pair1_game_points + updatedPP1AnnouncementPoints;
            const updatedPP2TotalPoints = state.resultData.player_pair2_game_points + updatedPP2AnnouncementPoints;

            return {
                resultData: {
                    ...state.resultData,
                    player_pair1_announcement_points: updatedPP1AnnouncementPoints,
                    player_pair2_announcement_points: updatedPP2AnnouncementPoints,
                    player_pair1_total_points: updatedPP1TotalPoints,
                    player_pair2_total_points: updatedPP2TotalPoints,
                },
            };
        });
    },
}));

export default useResultStore;
