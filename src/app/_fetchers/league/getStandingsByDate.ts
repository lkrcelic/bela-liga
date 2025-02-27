export async function getLeagueStandingsByDateAPI(leagueId: number): Promise<unknown> {
  const response = await fetch(`/api/leagues/${leagueId}/daily-standings`);

  if (!response.ok) {
    throw new Error(`Failed to fetch league table: ${response.statusText}`);
  }

  return response.json();
}
