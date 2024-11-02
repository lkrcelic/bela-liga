// src/store/announcementStore.ts
import {create} from 'zustand';
import {PlayerPairResponse} from "@/app/interfaces/playerPair";

type PlayerAnnouncements = {
    totalAnnouncements: number;
    team: 'ONE' | 'TWO';
    announcementCounts: { [key: number]: number };
};

export type PlayersAnnouncements = { [key: number]: PlayerAnnouncements };

type AnnouncementState = {
    playersAnnouncements: PlayersAnnouncements;
    activePlayerId: number | null;
    noAnnouncements: boolean;

    setActivePlayerId: (playerId: number | undefined) => void;
    setAnnouncement: (playerId: number | null, points: number) => void;
    resetPlayerAnnouncements: (playerId: number) => void;
    resetAnnouncements: () => void;
    initializePlayersAnnouncements: (
        playerPair1: PlayerPairResponse | null,
        playerPair2: PlayerPairResponse | null
    ) => void;
};

const initialState = {
    playersAnnouncements: {},
    activePlayerId: null,
    noAnnouncements: true,
};

const useAnnouncementStore = create<AnnouncementState>((set) => ({
    ...initialState,

    initializePlayersAnnouncements: (playerPair1, playerPair2) => set(() => ({
        playersAnnouncements: {
            [playerPair1!.player_id1]: {totalAnnouncements: 0, announcementCounts: {}, team: "ONE"},
            [playerPair1!.player_id2]: {totalAnnouncements: 0, announcementCounts: {}, team: "ONE"},
            [playerPair2!.player_id1]: {totalAnnouncements: 0, announcementCounts: {}, team: "TWO"},
            [playerPair2!.player_id2]: {totalAnnouncements: 0, announcementCounts: {}, team: "TWO"},
        },
    })),

    resetAnnouncements: () => set(() => ({...initialState})),

    setActivePlayerId: (playerId) => set({activePlayerId: playerId ?? null}),

    setAnnouncement: (playerId, points) =>
        set((state) => {
            if (!playerId) {
                return state;
            }

            const playerAnnouncements = state.playersAnnouncements[playerId];
            if (!playerAnnouncements) {
                return state;
            }

            const updatedCounts = {
                ...playerAnnouncements.announcementCounts,
                [points]: (playerAnnouncements.announcementCounts[points] || 0) + 1,
            };
            const totalAnnouncements = Object.entries(updatedCounts).reduce(
                (total, [pointValue, count]) => total + Number(pointValue) * count,
                0
            );
            const updatedPlayersAnnouncements = {
                ...state.playersAnnouncements,
                [playerId]: {
                    ...playerAnnouncements,
                    totalAnnouncements,
                    announcementCounts: updatedCounts,
                },
            };
            const hasAnnouncements = Object.values(updatedPlayersAnnouncements).some(
                (player) => player.totalAnnouncements > 0
            );
            return {
                playersAnnouncements: updatedPlayersAnnouncements,
                noAnnouncements: !hasAnnouncements,
            };
        }),

    resetPlayerAnnouncements: (playerId) =>
        set((state) => {
            const player = state.playersAnnouncements[playerId];
            if (!player) {
                return state;
            }

            const updatedPlayersAnnouncements = {
                ...state.playersAnnouncements,
                [playerId]: {
                    ...player,
                    totalAnnouncements: 0,
                    announcementCounts: {},
                },
            };
            const hasAnnouncements = Object.values(updatedPlayersAnnouncements).some(
                (player) => player.totalAnnouncements > 0
            );
            return {
                playersAnnouncements: updatedPlayersAnnouncements,
                noAnnouncements: !hasAnnouncements,
            };
        }),
}));

export default useAnnouncementStore;
