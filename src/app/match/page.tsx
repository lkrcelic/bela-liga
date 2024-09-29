"use client";

import React from 'react';
import {Box, Button, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import useMatchStore from "@/app/store/matchStore";
import {useRouter} from "next/navigation";

const MobileScoreBoard = () => {
    const {results, team1TotalPoints, team2TotalPoints} = useMatchStore();
    const router = useRouter();

    return (
        <Box sx={{padding: 2, backgroundColor: '#fefefe', height: '100vh'}}>
            <Grid container justifyContent="space-between" alignItems="center" sx={{mb: 4}}>
                <Grid item>
                    <Grid container direction="column" alignItems="center">
                        <Box sx={{
                            backgroundColor: '#4caf50',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" color="#fff">0</Typography>
                        </Box>
                        <Typography variant="h2" fontWeight="bold">{team1TotalPoints}</Typography>
                        <Typography variant="h6">MI</Typography>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container direction="column" alignItems="center">
                        <Box sx={{
                            backgroundColor: '#f44336',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" color="#fff">0</Typography>
                        </Box>
                        <Typography variant="h2" fontWeight="bold">{team2TotalPoints}</Typography>
                        <Typography variant="h6">VI</Typography>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container spacing={2} justifyContent="space-between" sx={{mb: 4}}>
                <Grid item size={{xs: 5}}>
                    {results.map((result, index) => (
                        <Typography key={index} variant="h5" textAlign="right">
                            {result.team1Points}
                        </Typography>
                    ))}
                </Grid>

                <Grid item xs={2}>
                    {results.map((_, index) => (
                        <Typography key={index} variant="h5" textAlign="center">
                            •
                        </Typography>
                    ))}
                </Grid>

                <Grid item size={{xs: 5}}>
                    {results.map((result, index) => (
                        <Typography key={index} variant="h5" textAlign="left">
                            {result.team2Points}
                        </Typography>
                    ))}
                </Grid>
            </Grid>

            <Grid container spacing={2} justifyContent="space-between">
                <Grid item size={{xs: 12}}>
                    <Button variant="contained" color="success" sx={{width: '100%', padding: 2}} onClick={() => router.push("/match/result/trump-caller")}>
                        <Typography variant="h6">Upisi igru</Typography>
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MobileScoreBoard;