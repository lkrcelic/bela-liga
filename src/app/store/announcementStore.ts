// src/store/announcementStore.ts
import {create} from "zustand";
import {PlayerAnnouncements} from "@/app/types/types";

type AnnouncementState = {
    playerAnnouncements: { [key: number]: PlayerAnnouncements };
    activePlayerId: number;
    noAnnouncements: boolean;
    setActivePlayerId: (playerId: number) => void;
    setAnnouncement: (playerId: number, points: number) => void;
    resetPlayerAnnouncements: (playerId: number) => void;
    getTotalAnnouncementsPerTeam: () => { team1: number; team2: number };
};

const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
    playerAnnouncements: {
        1: {totalAnnouncements: 0, announcementCounts: {}},
        2: {totalAnnouncements: 0, announcementCounts: {}},
        3: {totalAnnouncements: 0, announcementCounts: {}},
        4: {totalAnnouncements: 0, announcementCounts: {}},
    },
    activePlayerId: 1,
    noAnnouncements: true,
    setActivePlayerId: (playerId) => set({activePlayerId: playerId}),

    setAnnouncement: (playerId, points) =>
        set((state) => {
            const updatedCounts = {
                ...state.playerAnnouncements[playerId].announcementCounts,
                [points]:
                (state.playerAnnouncements[playerId].announcementCounts[points] ||
                    0) + 1,
            };

            const totalAnnouncements = Object.entries(updatedCounts).reduce(
                (total, [pointValue, count]) => total + Number(pointValue) * count,
                0
            );

            return {
                playerAnnouncements: {
                    ...state.playerAnnouncements,
                    [playerId]: {
                        totalAnnouncements,
                        announcementCounts: updatedCounts,
                    },
                },
                noAnnouncements: false,
            };
        }),

    resetPlayerAnnouncements: (playerId) =>
        set((state) => {
            const updatedPlayerAnnouncements = {
                ...state.playerAnnouncements,
                [playerId]: {
                    totalAnnouncements: 0,
                    announcementCounts: {},
                },
            };

            const hasAnnouncements = Object.values(updatedPlayerAnnouncements).some(
                (player) => player.totalAnnouncements > 0
            );

            return {
                playerAnnouncements: updatedPlayerAnnouncements,
                noAnnouncements: !hasAnnouncements,
            };
        }),
}));

export default useAnnouncementStore;
