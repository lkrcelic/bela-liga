import { Box, Typography } from "@mui/material";

interface ScoreBoxProps {
  teamColor: string;
  gameScore: number;
  announcementScore: number;
}

export function TeamScoreBox({
  teamColor,
  gameScore,
  announcementScore,
}: ScoreBoxProps) {
  return (
    <Box
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
    </Box>
  );
}
