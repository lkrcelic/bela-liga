"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import { Grid } from "@mui/system";
import { TeamScoreBox } from "@/app/match/result/ui/TeamScoreBox";
import AnnouncementSection from "@/app/match/result/ui/AnnouncementSection";

export default function Result() {
  const [team1Score] = useState(127);
  const [team2Score] = useState(162);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        height: "89vh",
        padding: 2,
      }}
    >
      {/* Announcement Section (Top) */}
      <Grid item>
        <AnnouncementSection position="top" />
      </Grid>

      {/* Score Section */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ marginBottom: 4 }}
      >
        <Grid item>
          <TeamScoreBox
            teamColor="#4caf50"
            gameScore={team1Score}
            announcementScore={team1Score}
            totalScore={team1Score}
          />
        </Grid>

        <Grid item>
          <TeamScoreBox
            teamColor="#f44336"
            gameScore={team2Score}
            announcementScore={team2Score}
            totalScore={team2Score}
          />
        </Grid>
      </Grid>

      {/* Announcement Section (Bottom) */}
      <Grid item>
        <AnnouncementSection position="bottom" />
      </Grid>
    </Box>
  );
}
