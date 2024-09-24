import { Button, Typography } from "@mui/material";

interface ScoreBoxProps {
  teamColor: string;
  gameScore: number;
  announcementScore: number;
  setActiveTeam: () => void;
}

export function TeamScoreBox({
  teamColor,
  gameScore,
  announcementScore,
  setActiveTeam,
}: ScoreBoxProps) {
  return (
    <Button
      onClick={setActiveTeam}
      sx={{
        width: "140px",
        height: "120px",
        backgroundColor: teamColor,
        color: "white",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="caption">IGRA: {gameScore}</Typography>
      <Typography variant="caption">ZVANJA: {announcementScore}</Typography>
      <Typography variant="h4">Σ {gameScore + announcementScore}</Typography>
    </Button>
  );
}
