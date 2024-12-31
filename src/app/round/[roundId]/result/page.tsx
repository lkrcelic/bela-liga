"use client";

import React, {useState} from 'react';
import {Box, Typography} from '@mui/material';
import {useParams, useRouter} from "next/navigation";
import {getRoundDataAPI} from "@/app/fetchers/round/getOne";
import useRoundStore from "@/app/store/RoundStore";
import {Grid} from "@mui/system";
import SingleActionButton from "@/app/ui/SingeActionButton";
import {finishRoundAPI} from "@/app/fetchers/round/finish";
import {getAllMatchesByRoundIdAPI} from "@/app/fetchers/match/getAllByRoundId";

const MobileScoreBoard = () => {
  const router = useRouter();
  const {roundId} = useParams();

  const {roundData: {team1_wins, team2_wins, team1, team2}, setRoundData} = useRoundStore();
  const [matches, setMatches] = useState();

  const fetchRoundData = async () => {
    try {
      const data = await getRoundDataAPI(Number(roundId));
      setRoundData(data);
    } catch (error) {
      console.error('Error fetching round data:', error);
    }
  };

  const fetchRoundMatches = async () => {
    try {
      const data = await getAllMatchesByRoundIdAPI(Number(roundId));
      setMatches(data);
    } catch (error) {
      console.error('Error fetching round matches:', error);
    }
  };

  React.useEffect(() => {
    fetchRoundData();
    fetchRoundMatches();
  }, [roundId]);

  const onClick = async () => {
    await finishRoundAPI(Number(roundId));

    router.push(`/`);
  };

  return (
    <>
      <Box sx={{gridArea: "top", alignSelf: "end"}}>
        <Grid container justifyContent="space-between" alignItems="top" spacing={6}>
          <Grid item size={{xs: 6}}>
            <Grid container direction="column" alignItems="center" spacing={2} paddingTop={1}>
              <Box
                sx={{
                  backgroundColor: 'team1.main',
                  color: "team1.contrastText",
                  width: 55,
                  height: 55,
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Typography variant="h4" color="#fff">{team1_wins}</Typography>
              </Box>
              <Typography variant="h7">{team1?.team_name}</Typography>
            </Grid>
          </Grid>
          <Grid item size={{xs: 6}}>
            <Grid container direction="column" alignItems="center" spacing={2} paddingTop={1}>
              <Box sx={{
                backgroundColor: 'team2.main',
                color: "team2.contrastText",
                width: 55,
                height: 55,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Typography variant="h4" color="#fff">{team2_wins}</Typography>
              </Box>
              <Typography variant="h7" align="center">{team2?.team_name}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{gridArea: "body", overflowY: 'auto', paddingTop: 4}}>
        <Grid container spacing={5} justifyContent="center" alignItems="bottom">
          {matches?.map((match, index) => (
            <Box key={index} sx={{width: '88%', borderRadius: '20px'}}>

              <Grid container item size={{xs: 12}} justifyContent="space-evenly" alignItems="center"
                    sx={{backgroundColor: "secondary.main", borderRadius: "20px", paddingY: 0.5}}>
                <Grid item size={{xs: 4}}>
                  <Typography variant="h4" textAlign="center" color={"default"} paddingRight={1}>
                    {match.player_pair1_score}
                  </Typography>
                </Grid>

                <Grid item size={{xs: 2}}>
                  <Typography variant="h4" textAlign="center">
                    •
                  </Typography>
                </Grid>

                <Grid item size={{xs: 4}}>
                  <Typography variant="h4" textAlign="center" color={"default"} paddingLeft={1}>
                    {match.player_pair2_score}
                  </Typography>
                </Grid>
              </Grid>

            </ Box>
          ))}
        </Grid>
      </Box>
      <Box sx={{gridArea: "actions", alignSelf: "start"}}>
        <SingleActionButton label={"Završi rundu"} onClick={onClick}/>
      </Box>
    </>
  );
};

export default MobileScoreBoard;
