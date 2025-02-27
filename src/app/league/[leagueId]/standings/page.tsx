"use client";

import React from "react";
import {Grid} from "@mui/system";
import {Box, CircularProgress, Typography} from "@mui/material";
import {getLeagueStandingsAPI} from "@/app/_fetchers/league/getStandings";
import SingleActionButton from "@/app/_ui/SingleActionButton";
import StandingsTable, {LeagueStandingsItem} from "@/app/_ui/StandingsTable";

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
      <Box   sx={{
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
      }}>
        <StandingsTable standings={leagueStandings as LeagueStandingsItem[]}/>
      </Box>
      <Box sx={{gridArea: "actions"}}>
        <SingleActionButton label={"Nazad"} onClick={() => window.history.back()}/>
      </Box>
    </>
  );
}
