import React from "react";
import { Box } from "@mui/material";
import AnnouncementScoreBox from "./AnnouncementScoreBox";
import useAnnouncementStore from "@/app/store/announcementStore";
import { Grid } from "@mui/system";

type Player = {
  id: number;
  name: string;
  color: string;
};

export default function PlayersSection() {
  const players: Player[] = [
    { id: 1, name: "Player 1", color: "#4caf50" },
    { id: 2, name: "Player 2", color: "#f44336" },
    { id: 3, name: "Player 3", color: "#4caf50" },
    { id: 4, name: "Player 4", color: "#f44336" },
  ];

  const {
    playerAnnouncements,
    activePlayerId,
    setActivePlayerId,
  } = useAnnouncementStore();

  return (
    <Box sx={{ alignItems: "center", backgroundColor: "#fefefe", paddingX: 1 }}>
      <Grid container rowSpacing={2}>
        {players.map((player) => (
          <Grid
            key={player.id}
            item
            size={{ xs: 6, sm: 6, md: 6 }}
            sx={{
              display: "flex",
              justifyContent: player.id % 2 === 0 ? "flex-end" : "flex-start",
            }}
          >
            <AnnouncementScoreBox
              key={player.id}
              playerName={player.name}
              announcementValue={
                playerAnnouncements[player.id]?.totalAnnouncements || 0
              }
              backgroundColor={
                activePlayerId === player.id ? player.color : "#9e9e9e"
              }
              onClick={() => setActivePlayerId(player.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
