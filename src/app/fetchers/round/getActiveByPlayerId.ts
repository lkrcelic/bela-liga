export async function getActiveRoundByPlayerIdAPI() {
  const response = await fetch(`/api/rounds/active`);

  if (!response.ok) {
    throw new Error(`Failed to fetch round: ${response.statusText}`);
  }

  return response.json();
}