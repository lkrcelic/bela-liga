"use client";

import React from "react";
import {Box, Typography} from "@mui/material";
import {Grid} from "@mui/system";
import PlayerPairSelector from "@/app/round/ui/PlayerPairSelector";
import useRoundStore from "@/app/store/RoundStore";

export default function PlayersAroundTable() {
  const {roundData: {team1, team2}} = useRoundStore();

  return (
    <Grid container spacing={2} sx={{position: "relative", width: "100%", height: "400px"}}>
      <PlayerPairSelector/>
      <Grid
        item
        size={{xs: 12}}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "190px",
            height: "190px",
            borderRadius: "50%",
            backgroundColor: "rgba(237, 224, 191, 0.4)", //TODO
            borderColor: "secondary.main",
            borderStyle: "solid",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h7" color="team1">{team1?.team_name}</Typography>
          <Typography variant="subtitle2" padding={1}>VS</Typography>
          <Typography variant="h7" color="team2">{team2?.team_name}</Typography>
        </Box>
      </Grid>
    </Grid>
  );
}
