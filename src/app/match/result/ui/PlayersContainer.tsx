import React from "react";
import { Box } from "@mui/material";
import { Player } from "@/app/types/types";
import { Grid } from "@mui/system";

type PlayersContainerProps = {
  players: Player[];
  children: (player: Player) => React.ReactNode;
};

export function PlayersContainer({ players, children }: PlayersContainerProps) {
  return (
    <Box sx={{ alignItems: "center", backgroundColor: "#fefefe", paddingX: 1 }}>
      <Grid container rowSpacing={2}>
        {players.map((player) => (
          <Grid
            key={player.id}
            item
            size={{ xs: 6, sm: 6, md: 6 }}
            sx={{
              display: "flex",
              justifyContent: player.id % 2 === 0 ? "flex-end" : "flex-start",
            }}
          >
            {children(player)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default PlayersContainer;
