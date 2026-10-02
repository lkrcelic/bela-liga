"use client";

import React from 'react';
import {Box, CircularProgress, Divider} from '@mui/material';
import TotalScoreSection from "@/app/ongoing-match/ui/TotalScoreSection";
import ResultsDisplay from "@/app/ongoing-match/ui/ResultsDisplay";
import Action from "@/app/ongoing-match/ui/Action";
import {useParams, useRouter} from "next/navigation";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import {getRoundDataAPI} from "@/app/_fetchers/round/getOne";
import useRoundStore from "@/app/_store/RoundStore";
import {getOngoingMatchAPI, OngoingMatchGoneError} from "@/app/_fetchers/ongoingMatch/getOne";
import {currentRoundPath} from "@/app/ongoing-match/ui/currentRoundPath";

const MobileScoreBoard = () => {
    const {matchId} = useParams();
    const {setOngoingMatch} = useOngoingMatchStore();
    const setRoundData = useRoundStore(state => state.setRoundData)
    const resetAnnouncements = useAnnouncementStore(state => state.resetAnnouncements);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    // The match was finished, e.g. on a teammate's phone: go to the next match or the round result
    const followFinishedMatch = async () => {
      const roundId = useRoundStore.getState().roundData?.id;
      router.replace(roundId ? await currentRoundPath(roundId) : "/");
    };

    const fetchOngoingMatchAndRoundData = async () => {
      try {
        const response = await getOngoingMatchAPI(Number(matchId));
        setOngoingMatch(response);
        resetAnnouncements();

        const data = await getRoundDataAPI(Number(response.round_id));
        setRoundData(data);

      } catch (error) {
        if (error instanceof OngoingMatchGoneError) {
          await followFinishedMatch();
          return;
        }
        console.error('Error fetching ongoing match or round data:', error);
      }
    }

    React.useEffect(() => {
      localStorage.clear();
      fetchOngoingMatchAndRoundData().then(() => setLoading(false));
    }, [matchId]);

    // Several phones can follow the same match, so pick up hands entered elsewhere
    React.useEffect(() => {
      const refresh = async () => {
        if (document.visibilityState !== "visible") return;
        try {
          setOngoingMatch(await getOngoingMatchAPI(Number(matchId)));
        } catch (error) {
          if (error instanceof OngoingMatchGoneError) await followFinishedMatch();
        }
      };
      const intervalId = setInterval(refresh, 15000);
      document.addEventListener("visibilitychange", refresh);
      return () => {
        clearInterval(intervalId);
        document.removeEventListener("visibilitychange", refresh);
      };
    }, [matchId]);

    if (loading) {
      return (
        <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
          <CircularProgress/>
        </Box>
      );
    }

    return (
      <>
        <Box sx={{gridArea: "top", alignSelf: "end"}}>
          <TotalScoreSection/>
        </Box>
        <Box sx={{gridArea: "body", overflowY: 'auto',}}>
          <Divider sx={{mb: 2}}/>
          <ResultsDisplay/>
        </Box>
        <Box sx={{gridArea: "actions", alignSelf: "start"}}>
          <Divider sx={{mb: 2}}/>
          <Action/>
        </Box>
      </>
    );
  }
;

export default MobileScoreBoard;
