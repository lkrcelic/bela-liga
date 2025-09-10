"use client";

import UserBootstrapper from "@/app/_bootstrap/UserBootstrapper";
import {getRoundDataAPI} from "@/app/_fetchers/round/getOne";
import useRoundStore from "@/app/_store/RoundStore";
import ActionButtons from "@/app/round/ui/ActionButtons";
import PlayersAroundTable from "@/app/round/ui/PlayersAroundTable";
import {Box, CircularProgress, Typography} from "@mui/material";
import {useParams} from "next/navigation";
import React, {useState} from "react";

export default function PlayersSeating() {
  const {roundId} = useParams();
  const [loading, setLoading] = useState(false);
  const setRoundData = useRoundStore((state) => state.setRoundData);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const data = await getRoundDataAPI(Number(roundId));
      setRoundData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching round data:", error);
    }
  };

  React.useEffect(() => {
    fetchTeamData();
  }, [roundId]);

  if (loading) {
    return (
      <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <UserBootstrapper />

      <Box sx={{gridArea: "top", alignSelf: "center"}}>
        <Typography variant="h4" align="center" fontWeight="bold">
          Raspored sjedenja
        </Typography>
      </Box>
      <Box sx={{gridArea: "body", alignSelf: "start"}}>
        <PlayersAroundTable />
      </Box>
      <Box sx={{gridArea: "actions", alignSelf: "end"}}>
        <ActionButtons />
      </Box>
    </>
  );
}
