import React from "react";
import { Grid } from "@mui/system";
import { TeamScoreBox } from "@/app/match/result/ui/TeamScoreBox";
import useResultStore from "@/app/store/resultStore";

export default function TeamsScoreSection() {
  const {
    team1GamePoints,
    team2TotalPoints,
    team1AnnouncementPoints,
    team2AnnouncementPoints,
    team1TotalPoints,
    team2GamePoints,
    activeTeam,
    setActiveTeam,
  } = useResultStore();

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
          gameScore={team1GamePoints}
          announcementScore={team1AnnouncementPoints}
          totalScore={team1TotalPoints}
          setActiveTeam={() => setActiveTeam("team1")}
        />
      </Grid>

      <Grid item xs={6}>
        <TeamScoreBox
          teamColor={activeTeam === "team2" ? "#f44336" : "#9e9e9e"}
          gameScore={team2GamePoints}
          announcementScore={team2AnnouncementPoints}
          totalScore={team2TotalPoints}
          setActiveTeam={() => setActiveTeam("team2")}
        />
      </Grid>
    </Grid>
  );
}
