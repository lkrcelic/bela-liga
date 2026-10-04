import {responseErrorMessage} from "@/app/_fetchers/errorMessage";

// A new team with its players (the first two become its founders); returns the new team's id
export async function createTeamAPI(team_name: string, players: number[]): Promise<number> {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({team_name, players}),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Failed to create team"));
  }

  const data = await response.json();
  return data.team_id;
}
