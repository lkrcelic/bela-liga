import React, { useState } from "react";
import { Badge, Box, Button } from "@mui/material";
import AnnouncementScoreBox from "./AnnouncementScoreBox";
import { Grid } from "@mui/system";

type AnnouncementSectionProps = {
  position: "top" | "bottom";
};

type Player = {
  id: number;
  name: string;
  color: string;
};

type AnnouncementCounts = { [key: string]: number };

type PlayerAnnouncements = {
  totalAnnouncements: number;
  announcementCounts: AnnouncementCounts;
};

export default function AnnouncementSection({
  position,
}: AnnouncementSectionProps) {
  const players: Player[] = [
    { id: 1, name: "Player 1", color: "#4caf50" },
    { id: 2, name: "Player 2", color: "#f44336" },
  ];

  const [activePlayerId, setActivePlayerId] = useState<number>(players[0].id);

  const [playerAnnouncements, setPlayerAnnouncements] = useState<{
    [key: number]: PlayerAnnouncements;
  }>({
    1: { totalAnnouncements: 0, announcementCounts: {} },
    2: { totalAnnouncements: 0, announcementCounts: {} },
  });

  const handleAnnouncement = (points: number | string) => {
    setPlayerAnnouncements((prevState) => {
      const playerData = prevState[activePlayerId];
      const currentCount = playerData.announcementCounts[points] || 0;
      return {
        ...prevState,
        [activePlayerId]: {
          totalAnnouncements:
            playerData.totalAnnouncements +
            (typeof points === "number" ? points : 0),
          announcementCounts: {
            ...playerData.announcementCounts,
            [points]: currentCount + 1,
          },
        },
      };
    });
  };

  const subtractAnnouncement = (points: number | string) => {
    setPlayerAnnouncements((prevState) => {
      const playerData = prevState[activePlayerId];
      const currentCount = playerData.announcementCounts[String(points)] || 0; // Convert to string
      if (currentCount > 0) {
        return {
          ...prevState,
          [activePlayerId]: {
            totalAnnouncements:
              playerData.totalAnnouncements -
              (typeof points === "number" ? points : 0),
            announcementCounts: {
              ...playerData.announcementCounts,
              [points]: currentCount - 1,
            },
          },
        };
      }
    });
  };

  const toggleActivePlayer = (playerId: number) => {
    setActivePlayerId(playerId);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: position === "top" ? "column" : "column-reverse",
        alignItems: "center",
        backgroundColor: "#fefefe",
      }}
    >
      {/* Score Boxes for Players */}
      <Grid container spacing={2} justifyContent="space-between">
        {players.map((player) => (
          <AnnouncementScoreBox
            key={player.id}
            playerName={player.name}
            announcementValue={
              playerAnnouncements[player.id].totalAnnouncements
            }
            backgroundColor={
              activePlayerId === player.id ? player.color : "#9e9e9e"
            }
            onClick={() => toggleActivePlayer(player.id)}
          />
        ))}
      </Grid>

      {/* Announcement Buttons with Add and Subtract */}
      <Grid
        container
        spacing={2}
        justifyContent="center"
        sx={{ marginBottom: 4, marginTop: 2 }}
      >
        {[20, 50, 100, 150, 200, "Štiglja"].map((points) => (
          <Grid item key={points}>
            <Badge
              badgeContent={
                playerAnnouncements[activePlayerId].announcementCounts[
                  points
                ] || 0
              }
              color="primary"
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Button
                variant="outlined"
                sx={{ fontSize: "16px", minWidth: "50px", height: "50px" }}
                onClick={() => handleAnnouncement(points)}
              >
                {points}
              </Button>
            </Badge>

            {/* Subtract Button Badge in the Top-Left */}
            <Badge
              badgeContent="x"
              color="error"
              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              onClick={() => subtractAnnouncement(points)}
            >
              <Box sx={{ position: "relative", width: 0, height: 0 }} />
            </Badge>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
