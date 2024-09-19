import React, { useState } from "react";
import { Grid } from "@mui/system";
import { TeamScoreBox } from "@/app/match/result/ui/TeamScoreBox";
import useAnnouncementStore from "@/app/store/announcementStore";

export default function TeamsScoreSection() {
  const [team1Score] = useState(0);
  const [team2Score] = useState(0);
  const { playerAnnouncements } = useAnnouncementStore();

  return (
    <Grid
      container
      spacing={4}
      alignItems="center"
      justifyContent="space-between"
    >
      <Grid item xs={6}>
        <TeamScoreBox
          teamColor="#4caf50"
          gameScore={team1Score}
          announcementScore={
            playerAnnouncements[1].totalAnnouncements +
            playerAnnouncements[3].totalAnnouncements
          }
        />
      </Grid>

      <Grid item xs={6}>
        <TeamScoreBox
          teamColor="#f44336"
          gameScore={team2Score}
          announcementScore={
            playerAnnouncements[2].totalAnnouncements +
            playerAnnouncements[4].totalAnnouncements
          }
        />
      </Grid>
    </Grid>
  );
}
