// src/store/announcementStore.ts
import { create } from "zustand";

type AnnouncementCounts = { [key: number]: number };

type PlayerAnnouncements = {
  totalAnnouncements: number;
  announcementCounts: AnnouncementCounts;
};

type AnnouncementState = {
  playerAnnouncements: { [key: number]: PlayerAnnouncements };
  activePlayerId: number;
  noAnnouncements: boolean;
  setActivePlayerId: (playerId: number) => void;
  setAnnouncement: (playerId: number, points: number) => void;
  resetPlayerAnnouncements: (playerId: number) => void;
};

const useAnnouncementStore = create<AnnouncementState>((set) => ({
  playerAnnouncements: {
    1: { totalAnnouncements: 0, announcementCounts: {} },
    2: { totalAnnouncements: 0, announcementCounts: {} },
    3: { totalAnnouncements: 0, announcementCounts: {} },
    4: { totalAnnouncements: 0, announcementCounts: {} },
  },
  activePlayerId: 1,
  noAnnouncements: true,
  setActivePlayerId: (playerId) => set({ activePlayerId: playerId }),

  setAnnouncement: (playerId, points) =>
    set((state) => {
      const updatedCounts = {
        ...state.playerAnnouncements[playerId].announcementCounts,
        [points]:
          (state.playerAnnouncements[playerId].announcementCounts[points] ||
            0) + 1,
      };

      // Now we calculate the total announcements by multiplying each key (points) by its count
      const totalAnnouncements = Object.entries(updatedCounts).reduce(
        (total, [pointValue, count]) => total + pointValue * count,
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

  resetPlayerAnnouncements: (playerId: number) =>
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
