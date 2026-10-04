"use client";

// MOCK DATA LAYER — league administration that has no backend yet.
//
// The design adds Manage League (active / inactive teams, adding existing teams to a league) and Create League, but
// the database has no `active` flag on LeagueTeam and the API has no endpoints to add a team to a league or to create
// a league. Until it does, these changes live in this browser only (localStorage), behind the functions below.
// To switch to a real backend, keep the hook's shape and replace the store actions with API calls.

import {useMemo} from "react";
import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

export type MockTeam = {team_id: number; team_name: string; players: string[]};

export type MockLeague = {
  id: string;
  name: string;
  season: string;
  startDate: string;
  // 0 = Monday … 6 = Sunday
  playDay: number;
  roundsPerNight: number;
  teamIds: number[];
  createdAt: string;
};

type LeagueAdminState = {
  // leagueId -> team ids marked inactive
  inactive: Record<string, number[]>;
  // leagueId -> teams added to the league on this device
  added: Record<string, MockTeam[]>;
  leagues: MockLeague[];
  setTeamActive: (leagueId: number, teamId: number, active: boolean) => void;
  addTeamToLeague: (leagueId: number, team: MockTeam) => void;
  createLeague: (league: Omit<MockLeague, "id" | "createdAt">) => MockLeague;
};

export const useLeagueAdminMock = create<LeagueAdminState>()(
  persist(
    (set) => ({
      inactive: {},
      added: {},
      leagues: [],
      setTeamActive: (leagueId, teamId, active) =>
        set((s) => {
          const key = String(leagueId);
          const current = new Set(s.inactive[key] ?? []);
          if (active) current.delete(teamId);
          else current.add(teamId);
          return {inactive: {...s.inactive, [key]: Array.from(current)}};
        }),
      addTeamToLeague: (leagueId, team) =>
        set((s) => {
          const key = String(leagueId);
          const list = s.added[key] ?? [];
          if (list.some((t) => t.team_id === team.team_id)) return s;
          return {added: {...s.added, [key]: [team, ...list]}};
        }),
      createLeague: (league) => {
        const created: MockLeague = {...league, id: `local-${Date.now()}`, createdAt: new Date().toISOString()};
        set((s) => ({leagues: [created, ...s.leagues]}));
        return created;
      },
    }),
    {name: "league-admin-mock", storage: createJSONStorage(() => localStorage)}
  )
);

// Inactive team ids of a league, as a Set
export function useInactiveTeams(leagueId: number | null): Set<number> {
  const list = useLeagueAdminMock((s) => (leagueId == null ? undefined : s.inactive[String(leagueId)]));
  return useMemo(() => new Set(list ?? []), [list]);
}

export const MOCK_NOTICE = "Pregled · spremljeno samo na ovom uređaju dok backend ne podrži ovu funkciju.";
