"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Player } from "@/app/types/types";
import PlayersContainer from "@/app/match/result/ui/PlayersContainer";
import useResultStore from "@/app/store/resultStore";

export default function TrumpCallerSection() {
  const players: Player[] = [
    { id: 1, name: "Player 1", color: "#4caf50" },
    { id: 2, name: "Player 2", color: "#f44336" },
    { id: 3, name: "Player 3", color: "#4caf50" },
    { id: 4, name: "Player 4", color: "#f44336" },
  ];

  const { setTrumpCallerId } = useResultStore();

  const [title, setTitle] = React.useState("Select Trump Caller");

  return (
    <>
      <Typography variant="h4" color="black">
        {title}
      </Typography>
      <PlayersContainer players={players}>
        {(player) => (
          <PlayerBox
            key={player.id}
            playerName={player.name}
            backgroundColor={player.color}
            onClick={() => {
              setTrumpCallerId(player.id);
              setTitle("Trump Caller: " + player.name);
            }}
          />
        )}
      </PlayersContainer>
    </>
  );
}

type PlayerBoxProps = {
  playerName: string;
  backgroundColor: string;
  onClick?: () => void;
};

function PlayerBox({ playerName, backgroundColor, onClick }: PlayerBoxProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: "100px",
        height: "100px",
        backgroundColor: backgroundColor,
        color: "white",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <Typography variant="h6">{playerName}</Typography>
    </Box>
  );
}
