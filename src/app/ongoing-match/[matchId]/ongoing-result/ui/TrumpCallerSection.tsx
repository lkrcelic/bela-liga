"use client";

import {TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import useAuthStore from "@/app/_store/authStore";
import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";
import {Box, Button, Typography} from "@mui/material";

export default function TrumpCallerSection() {
  const {
    roundData: {team1, team2},
  } = useRoundStore();
  const {
    resultData: {trump_caller_team},
    setTrumpCallerTeam,
  } = useResultStore();
  const {user} = useAuthStore();

  // Decide orientation: show current user's team on the left
  const userId = user?.id;
  const team1PlayerIds = team1?.teamPlayers?.map((tp) => tp.player.id) ?? [];
  const team2PlayerIds = team2?.teamPlayers?.map((tp) => tp.player.id) ?? [];
  const isUserInTeam1 = userId != null && team1PlayerIds.includes(userId);
  const isUserInTeam2 = userId != null && team2PlayerIds.includes(userId);
  const showTeam1Left = isUserInTeam1 || (!isUserInTeam1 && !isUserInTeam2);

  const leftSide: TeamSide = showTeam1Left ? 1 : 2;
  const rightSide: TeamSide = showTeam1Left ? 2 : 1;
  const teamName = (side: TeamSide) => (side === 1 ? team1?.team_name : team2?.team_name);

  return (
    <Box sx={{display: "flex", justifyContent: "space-evenly", alignItems: "center"}}>
      <TrumpCallerButton
        teamName={teamName(leftSide) || "MI"}
        color="team1"
        isTrumpCaller={trump_caller_team === leftSide}
        onClick={() => setTrumpCallerTeam(leftSide)}
      />
      <TrumpCallerButton
        teamName={teamName(rightSide) || "VI"}
        color="team2"
        isTrumpCaller={trump_caller_team === rightSide}
        onClick={() => setTrumpCallerTeam(rightSide)}
      />
    </Box>
  );
}

type TrumpCallerButtonProps = {
  teamName: string;
  color: "team1" | "team2";
  isTrumpCaller: boolean;
  onClick: () => void;
};

function TrumpCallerButton({teamName, color, isTrumpCaller, onClick}: TrumpCallerButtonProps) {
  return (
    <Button
      onClick={onClick}
      color={color}
      variant={isTrumpCaller ? "contained" : "outlined"}
      sx={{
        width: "140px",
        height: "140px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 1,
      }}
    >
      <Typography variant="h6" sx={{overflowWrap: "anywhere"}}>
        {teamName}
      </Typography>
    </Button>
  );
}
