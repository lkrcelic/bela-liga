import React from "react";
import { Grid } from "@mui/system";
import { TeamScoreBox } from "@/app/match/result/ui/TeamScoreBox";
import useAnnouncementStore from "@/app/store/announcementStore";
import useScoreStore from "@/app/store/scoreStore";

export default function TeamsScoreSection() {
  const { team1Score, team2Score, activeTeam, setActiveTeam } = useScoreStore();
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
          teamColor={activeTeam === "team1" ? "#4caf50" : "#9e9e9e"}
          gameScore={team1Score}
          announcementScore={
            playerAnnouncements[1].totalAnnouncements +
            playerAnnouncements[3].totalAnnouncements
          }
          setActiveTeam={() => setActiveTeam("team1")}
        />
      </Grid>

      <Grid item xs={6}>
        <TeamScoreBox
          teamColor={activeTeam === "team2" ? "#f44336" : "#9e9e9e"}
          gameScore={team2Score}
          announcementScore={
            playerAnnouncements[2].totalAnnouncements +
            playerAnnouncements[4].totalAnnouncements
          }
          setActiveTeam={() => setActiveTeam("team2")}
        />
      </Grid>
    </Grid>
  );
}
