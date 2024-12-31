export async function getLeagueStandingsAPI(leagueId: number): Promise<any> {
  const response = await fetch(`/api/leagues/${leagueId}/standings`);

  if (!response.ok) {
    throw new Error(`Failed to fetch league table: ${response.statusText}`);
  }

  return response.json();
}
