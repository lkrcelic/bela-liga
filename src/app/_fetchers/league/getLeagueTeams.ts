import {responseErrorMessage} from "@/app/_fetchers/errorMessage";

export type LeagueTeamEntry = {league_id: number; team_id: number; team: {team_id: number; team_name: string}};

// Teams of a league (admin only; the bye team is left out by the API)
export async function getLeagueTeamsAPI(leagueId: number): Promise<LeagueTeamEntry[]> {
  const response = await fetch(`/api/leagueTeams/${leagueId}`);
  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Failed to fetch teams"));
  }
  return response.json();
}
