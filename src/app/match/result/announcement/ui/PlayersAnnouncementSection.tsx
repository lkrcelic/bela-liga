import React from "react";
import { Box, Typography } from "@mui/material";
import useAnnouncementStore from "@/app/store/announcementStore";
import { Player } from "@/app/types/types";
import PlayersContainer from "@/app/match/result/ui/PlayersContainer";

export default function PlayersAnnouncementSection() {
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
    <PlayersContainer players={players}>
      {(player) => (
        <PlayerAnnouncementBox
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
      )}
    </PlayersContainer>
  );
}

type AnnouncementBoxProps = {
  playerName: string;
  announcementValue: number | string;
  backgroundColor: string;
  onClick?: () => void;
};

function PlayerAnnouncementBox({
  playerName,
  announcementValue,
  backgroundColor,
  onClick,
}: AnnouncementBoxProps) {
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
      <Typography variant="caption">{playerName}</Typography>
      <Typography variant="h6">{announcementValue}</Typography>
    </Box>
  );
}
