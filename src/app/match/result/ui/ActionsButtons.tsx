import { Box, Button, Typography } from "@mui/material";

export default function ActionsButtons() {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        paddingTop: 2,
        bgcolor: "#fefefe",
        gap: 4,
      }}
    >
      <Button sx={{ flexGrow: 1 }} variant="contained" color="primary">
        <Typography variant="button">Nazad</Typography>
      </Button>

      <Button sx={{ flexGrow: 1 }} variant="contained" color="primary">
        <Typography variant="button">Spremi</Typography>
      </Button>
    </Box>
  );
}
