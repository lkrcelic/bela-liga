import { Box, Typography } from "@mui/material";

type AnnouncementScoreBoxProps = {
  playerName: string;
  announcementValue: number | string;
  backgroundColor: string;
  onClick?: () => void;
};

export default function AnnouncementScoreBox({
  playerName,
  announcementValue,
  backgroundColor,
  onClick,
}: AnnouncementScoreBoxProps) {
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
