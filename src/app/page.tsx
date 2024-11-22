"use client"; // This is a client component

import {useEffect} from "react";
import {logoutUser} from "@/app/fetchers/authentication/logout";
import {Box, Button} from "@mui/material";
import {useRouter} from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function logOut(): Promise<void> {
    await logoutUser();
    window.location.reload();
  }

  async function startGame(): Promise<void> {
    console.log("Starting game...");
  }

  async function createRound() {
    router.push("/createRound");
  }

  // Fetch all players
  useEffect(() => {
    async function checkUserAdmin() {
      try {
        // check if user is admin
      } catch (error) {}
    }
  }, []);

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
        <Button variant="contained" color="secondary" onClick={logOut}>
          Log out
        </Button>
      </Box>
    </>
  );
}
