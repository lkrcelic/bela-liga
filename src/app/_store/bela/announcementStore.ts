// src/store/announcementStore.ts
import {create} from 'zustand';
import {BelaPlayerAnnouncementResponse, TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import {createJSONStorage, persist} from "zustand/middleware";

type TeamAnnouncements = {
  totalAnnouncements: number;
  cardCount: number,
  announcementCounts: { [key: number]: number };
};

export type TeamsAnnouncements = Record<TeamSide, TeamAnnouncements>;

type AnnouncementState = {
  teamsAnnouncements: TeamsAnnouncements;
  noAnnouncements: boolean;

  setAnnouncement: (team: TeamSide, points: number) => void;
  resetTeamAnnouncements: (team: TeamSide) => void;
  resetAnnouncements: () => void;
  setTeamsAnnouncements: (data: BelaPlayerAnnouncementResponse[]) => void;
};

const emptyTeamsAnnouncements = (): TeamsAnnouncements => ({
  1: {totalAnnouncements: 0, announcementCounts: {}, cardCount: 0},
  2: {totalAnnouncements: 0, announcementCounts: {}, cardCount: 0},
});

const hasAnnouncements = (teamsAnnouncements: TeamsAnnouncements) =>
  Object.values(teamsAnnouncements).some((team) => team.totalAnnouncements > 0);

const PrismaAnnouncementEnumValueMap = {
  "TWENTY": 20,
  "FIFTY": 50,
  "ONE_HUNDRED": 100,
  "ONE_HUNDRED_FIFTY": 150,
  "TWO_HUNDRED": 200,
};

const PrismaAnnouncementCardCountMap = {20: 3, 50: 4, 100: 4, 150: 4, 200: 4,};

const MAX_TEAM_CARD_COUNT = 16; // 2 players x 8 cards

const useAnnouncementStore = create<AnnouncementState>()(persist<AnnouncementState>((set) => ({
    teamsAnnouncements: emptyTeamsAnnouncements(),
    noAnnouncements: true,

    setTeamsAnnouncements: (data: BelaPlayerAnnouncementResponse[]) => set(() => {
      const teamsAnnouncements = emptyTeamsAnnouncements();

      data.forEach(({team, announcement_type}) => {
        const announcementValue = PrismaAnnouncementEnumValueMap[announcement_type];
        const teamAnn = teamsAnnouncements[team];

        if (announcementValue !== undefined && teamAnn) {
          teamAnn.announcementCounts[announcementValue] = (teamAnn.announcementCounts[announcementValue] || 0) + 1;
          teamAnn.totalAnnouncements += announcementValue;
          teamAnn.cardCount += PrismaAnnouncementCardCountMap[announcementValue];
        }
      });

      return {
        teamsAnnouncements,
        noAnnouncements: !hasAnnouncements(teamsAnnouncements),
      };
    }),

    resetAnnouncements:
      () => set(() => ({teamsAnnouncements: emptyTeamsAnnouncements(), noAnnouncements: true})),

    setAnnouncement:
      (team, points) =>
        set((state) => {
          const teamAnnouncements = state.teamsAnnouncements[team];
          if (!teamAnnouncements) {
            return state;
          }

          const updatedCardCount = teamAnnouncements.cardCount + PrismaAnnouncementCardCountMap[points];
          if (updatedCardCount > MAX_TEAM_CARD_COUNT) {
            return state;
          }

          const updatedAnnouncementCounts = {
            ...teamAnnouncements.announcementCounts,
            [points]: (teamAnnouncements.announcementCounts[points] || 0) + 1,
          };

          const totalAnnouncements = Object.entries(updatedAnnouncementCounts).reduce(
            (total, [pointValue, count]) => total + Number(pointValue) * count,
            0
          );

          const updatedTeamsAnnouncements = {
            ...state.teamsAnnouncements,
            [team]: {
              totalAnnouncements,
              announcementCounts: updatedAnnouncementCounts,
              cardCount: updatedCardCount,
            },
          };

          return {
            teamsAnnouncements: updatedTeamsAnnouncements,
            noAnnouncements: !hasAnnouncements(updatedTeamsAnnouncements),
          };
        }),

    resetTeamAnnouncements:
      (team) =>
        set((state) => {
          const updatedTeamsAnnouncements = {
            ...state.teamsAnnouncements,
            [team]: {totalAnnouncements: 0, cardCount: 0, announcementCounts: {}},
          };

          return {
            teamsAnnouncements: updatedTeamsAnnouncements,
            noAnnouncements: !hasAnnouncements(updatedTeamsAnnouncements),
          };
        }),
  }), {
    name: 'announcement-store',
    storage: createJSONStorage(() => localStorage),
  }
));

export default useAnnouncementStore;
