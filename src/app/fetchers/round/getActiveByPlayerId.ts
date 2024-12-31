export async function getActiveRoundByPlayerIdAPI(playerId: number) {
  const response = await fetch(`/api/rounds/players/${playerId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch round: ${response.statusText}`);
  }

  return response.json();
}