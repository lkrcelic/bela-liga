// src/store/scoreStore.ts
import {create} from "zustand";
import {PlayerAnnouncements} from "@/app/types/types";
import {BelaResultType} from "@/app/lib/interfaces/belaResult";

export type ResultState = BelaResultType & {
    team1TotalPoints: number;
    team2TotalPoints: number;
    activeTeam: "team1" | "team2";
    complete_victory: boolean;
    pass: boolean;
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
    complete_victory: false,
    player_pair1_game_points: 0,
    player_pair2_game_points: 0,
    player_pair1_announcement_points: 0,
    player_pair2_announcement_points: 0,
    card_shuffler_id: 1,  //TODO: Remove this hardcoded 1
    trumpCallerPosition: null,
    playerPair1TotalPoints: 0,
    playerPair2TotalPoints: 0,
    trump_caller_id: 1, //TODO: Remove this hardcoded 1
    pass: true, //TODO think about this is this needed (if added total points)
    activeTeam: "team1",
};

const useResultStore = create<ResultState>((set) => ({
        ...initialState,

        resetResult: () => set(initialState),

        setTrumpCallerId: (playerId) => set({trump_caller_id: playerId}),

        setActiveTeam: (team) => set({activeTeam: team}),

        updateScore: (digit: number) =>
            set((state) => {
                const {
                    activeTeam,
                    player_pair1_game_points,
                    player_pair2_game_points,
                    player_pair1_announcement_points,
                    player_pair2_announcement_points,
                    trump_caller_id,
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

                if (team1Called && updatedPP1TotalPoints < updatedPP2TotalPoints) {
                    updatedPP1TotalPoints = 0;
                    updatedPP2TotalPoints = MAX_SCORE + player_pair2_announcement_points + player_pair1_announcement_points;

                } else if (!team1Called && updatedPP2TotalPoints < updatedPP1TotalPoints) {
                    updatedPP2TotalPoints = 0;
                    updatedPP1TotalPoints = MAX_SCORE + player_pair1_announcement_points + player_pair2_announcement_points;
                }

                return {
                    player_pair1_game_points: pp1UpdatedGamePoints,
                    player_pair2_game_points: pp2UpdatedGamePoints,
                    playerPair1TotalPoints: updatedPP1TotalPoints,
                    playerPair2TotalPoints: updatedPP2TotalPoints,
                };
            }),

        resetScore: () =>
            set((state) => ({
                player_pair1_game_points: 0,
                player_pair2_game_points: 0,
                playerPair1TotalPoints: state.player_pair1_announcement_points,
                playerPair2TotalPoints: state.player_pair2_announcement_points,
                complete_victory: false,
            })),

        setStiglja:
            () =>
                set((state) => {
                    const {
                        activeTeam,
                        player_pair1_announcement_points,
                        player_pair2_announcement_points,
                    } = state;
                    /*TODO Add check for trump caller*/
                    if (activeTeam === "team1") {
                        return {
                            complete_victory: true,
                            player_pair1_game_points: STIGLJA_SCORE,
                            player_pair2_game_points: 0,
                            playerPair1TotalPoints:
                                STIGLJA_SCORE + player_pair1_announcement_points + player_pair2_announcement_points,
                            playerPair2TotalPoints: 0,
                        };
                    } else {
                        return {
                            complete_victory: true,
                            player_pair1_game_points: 0,
                            player_pair2_game_points: STIGLJA_SCORE,
                            playerPair1TotalPoints: 0,
                            playerPair2TotalPoints:
                                STIGLJA_SCORE + player_pair2_announcement_points + player_pair1_announcement_points,
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

                const team1Players = [1, 2];
                const team2Players = [3, 4];

                const updatedPP1AnnouncementPoints = calculateTeamPoints(team1Players);
                const updatedPP2AnnouncementPoints = calculateTeamPoints(team2Players);

                set({
                    player_pair1_announcement_points: updatedPP1AnnouncementPoints,
                    player_pair2_announcement_points: updatedPP2AnnouncementPoints,
                });

                set((state) => ({
                    playerPair1TotalPoints: state.player_pair1_game_points + state.player_pair1_announcement_points,
                    playerPair2TotalPoints: state.player_pair2_game_points + state.player_pair2_announcement_points,
                }));
            },
    }))
;

export default useResultStore;
