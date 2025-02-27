"use client";

import React, {useState} from "react";
import {Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Typography} from "@mui/material";
import SingleActionButton from "@/app/_ui/SingleActionButton";
import StandingsTable, {LeagueStandingsItem} from "@/app/_ui/StandingsTable";
import {getLeagueStandingsByDateAPI} from "@/app/_fetchers/league/getStandingsByDate";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function PlayersSeating() {
  const [leagueStandings, setLeagueStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expandedStandings, setExpandedStandings] = useState(false);
  const [expandedRound1, setExpandedRound1] = useState(false);
  const [expandedRound2, setExpandedRound2] = useState(false);
  const [expandedRound3, setExpandedRound3] = useState(false);

  const fetchLeagueStandings = async () => {
    try {
      const data = await getLeagueStandingsByDateAPI(1); //TODO remove hardcoded

      setLeagueStandings(data);
    } catch (error) {
      console.error("Error fetching league standings:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (expandedStandings && !leagueStandings) {
      fetchLeagueStandings();
    }
  }, [expandedStandings]);

  /*
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
  */
  const handleChange = (setter) => () => {
    setter((prevExpanded) => !prevExpanded);
  };


  return (
    <>
      <Box sx={{gridArea: "top", alignSelf: "center"}}>
        <Typography variant="h4" align="center" fontWeight="bold">Okupljanje 17.02.2025</Typography>
      </Box>
      <Box sx={{gridArea: "body"}}>
        <Accordion sx={{width: "100%"}} expanded={expandedStandings} onChange={handleChange(setExpandedStandings)}>
          <AccordionSummary
            expandIcon={
              <IconButton>
                <ExpandMoreIcon/>
              </IconButton>
            }
            aria-controls="panel-content"
            id="panel-header"
          >
            <Typography variant="h6">{"Tablica okupljanja"}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box   sx={{
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
              <StandingsTable standings={(leagueStandings as LeagueStandingsItem[]) || []}/>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedRound1} onChange={handleChange(setExpandedRound1)}>
          <AccordionSummary
            expandIcon={
              <IconButton>
                <ExpandMoreIcon/>
              </IconButton>
            }
            aria-controls="panel-content"
            id="panel-header"
          >
            <Typography variant="h6">{"Round 12"}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <span>Sadržaj</span>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedRound2} onChange={handleChange(setExpandedRound2)}>
          <AccordionSummary
            expandIcon={
              <IconButton>
                <ExpandMoreIcon/>
              </IconButton>
            }
            aria-controls="panel-content"
            id="panel-header"
          >
            <Typography variant="h6">{"Round 13"}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <span>Sadržaj</span>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedRound3} onChange={handleChange(setExpandedRound3)}>
          <AccordionSummary
            expandIcon={
              <IconButton>
                <ExpandMoreIcon/>
              </IconButton>
            }
            aria-controls="panel-content"
            id="panel-header"
          >
            <Typography variant="h6">{"Round 14"}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <span>Sadržaj</span>
          </AccordionDetails>
        </Accordion>

      </Box>
      <Box sx={{gridArea: "actions"}}>
        <SingleActionButton label={"Nazad"} onClick={() => window.history.back()}/>
      </Box>
    </>
  );
}
