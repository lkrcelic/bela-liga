"use client";

import {logoutUser} from "@/app/fetchers/authentication/logout";
import {Box, Button} from "@mui/material";
import {useRouter} from "next/navigation";
import {getActiveRoundByPlayerIdAPI} from "@/app/fetchers/round/getActiveByPlayerId";

export default function Home() {
  const router = useRouter();

  async function logOut(): Promise<void> {
    await logoutUser();
    window.location.reload();
  }

  async function startGame(): Promise<void> {
    const {roundId, ongoingMatchId} = await getActiveRoundByPlayerIdAPI()
    if (ongoingMatchId) {
      router.push(`/ongoing-match/${ongoingMatchId}`);
    } else {
      router.push(`/round/${roundId}/players-seating`);
    }
  }

  async function createRound() {
    router.push("/createRound");
  }

  async function table() {
    router.push("/league/1/standings");
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "100%",
          padding: 2,
          boxSizing: "border-box",
        }}
      >
        <Button variant="contained" color="primary" onClick={createRound}>
          Create round
        </Button>
        <Button variant="contained" color="primary" onClick={startGame}>
          Start game
        </Button>
        <Button variant="contained" color="primary" onClick={table}>
          League Standings
        </Button>
        <Button variant="contained" color="secondary" onClick={logOut}>
          Log out
        </Button>
      </Box>
    </>
  );
}
