"use client";

import React from "react";
import {Grid} from "@mui/system";
import {Box, CircularProgress, Typography} from "@mui/material";
import {getLeagueStandingsAPI} from "@/app/_fetchers/league/getStandings";
import SingleActionButton from "@/app/_ui/SingleActionButton";

export default function PlayersSeating() {
  const [leagueStandings, setLeagueStandings] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchLeagueStandings = async () => {
    try {
      const data = await getLeagueStandingsAPI(1); //TODO remove hardcoded

      setLeagueStandings(data);
    } catch (error) {
      console.error("Error fetching league standings:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeagueStandings();
  }, []);


  if (loading) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
        <CircularProgress/>
      </Box>
    );
  }

  if (!leagueStandings) {
    return <p>No data available</p>;
  }

  return (
    <>
      <Box sx={{gridArea: "top", alignSelf: "center"}}>
        <Typography variant="h4" align="center" fontWeight="bold">Tablica</Typography>
      </Box>
      <Box
        sx={{
          gridArea: "body",
          alignSelf: "start",
          justifyContent: {
            xs: "flex-start",
            sm: "center",
          },
          display: "flex",
          overflow: "auto",
          maxHeight: "100%",
          width: "100%",
          fontFamily: "Roboto, sans-serif",
        }}
      >
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

          {leagueStandings.map((leagueStandings, index) => (
            <Grid
              container
              spacing={2}
              key={leagueStandings.id}
              paddingY={1}
              paddingLeft={1}
              sx={{
                textAlign: "center",
                borderBottom: "1px solid #eee",
                backgroundColor: index % 2 ? "background.default" : "",

              }}
            >
              <Grid item size={{xs: 0.5}}>{index + 1}</Grid>
              <Grid item textAlign={"left"} size={{xs: 3.4}}>{leagueStandings.team.team_name}</Grid>
              <Grid item size={{xs: 1.35}}>{leagueStandings.rounds_played}</Grid>
              <Grid item size={{xs: 1.35}}>{leagueStandings.wins}</Grid>
              <Grid item size={{xs: 1.35}}>{leagueStandings.draws}</Grid>
              <Grid item size={{xs: 1.35}}>{leagueStandings.losses}</Grid>
              <Grid item size={{xs: 1.45}}>{leagueStandings.point_difference}</Grid>
              <Grid item size={{xs: 1.25}}>{leagueStandings.score}</Grid>
            </Grid>
          ))}
        </Box>
      </Box>
      <Box sx={{gridArea: "actions"}}>
        <SingleActionButton label={"Nazad"} onClick={() => window.history.back()}/>
      </Box>
    </>
  );
}
