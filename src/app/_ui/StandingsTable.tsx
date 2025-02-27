import React from "react";
import {Grid} from "@mui/system";
import {Box} from "@mui/material";

export type LeagueStandingsItem = {
  id: string | number;
  team: {
    team_name: string;
  };
  rounds_played: number;
  wins: number;
  draws: number;
  losses: number;
  point_difference: number;
  score: number;
}

export interface LeagueStandingsProps {
  standings: LeagueStandingsItem[];
}

export default function StandingsTable({standings}: LeagueStandingsProps) {
  return (
      <Box
        sx={{display: "inline-block", width: "100%", minWidth: "550px", overflow: "auto"}}
      >
        <Grid
          container
          spacing={2}
          paddingY={1}
          paddingLeft={1}
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            position: "sticky",
            top: 0,
            backgroundColor: "secondary.main",
          }}
        >
          <Grid item size={{xs: 0.5}}>#</Grid>
          <Grid item textAlign={"left"} size={{xs: 3.4}}>Ime ekipe</Grid>
          <Grid item size={{xs: 1.35}}>OK</Grid>
          <Grid item size={{xs: 1.35}}>POB</Grid>
          <Grid item size={{xs: 1.35}}>NER</Grid>
          <Grid item size={{xs: 1.35}}>IZG</Grid>
          <Grid item size={{xs: 1.45}}>RAZ</Grid>
          <Grid item size={{xs: 1.25}}>BOD</Grid>
        </Grid>

        {standings.map((row, index) => (
          <Grid
            container
            spacing={2}
            key={row.id}
            paddingY={1}
            paddingLeft={1}
            sx={{
              textAlign: "center",
              borderBottom: "1px solid #eee",
              backgroundColor: index % 2 ? "background.default" : "",

            }}
          >
            <Grid item size={{xs: 0.5}}>{index + 1}</Grid>
            <Grid item textAlign={"left"} size={{xs: 3.4}}>{row.team.team_name}</Grid>
            <Grid item size={{xs: 1.35}}>{row.rounds_played}</Grid>
            <Grid item size={{xs: 1.35}}>{row.wins}</Grid>
            <Grid item size={{xs: 1.35}}>{row.draws}</Grid>
            <Grid item size={{xs: 1.35}}>{row.losses}</Grid>
            <Grid item size={{xs: 1.45}}>{row.point_difference}</Grid>
            <Grid item size={{xs: 1.25}}>{row.score}</Grid>
          </Grid>
        ))}
      </Box>
  );
}
