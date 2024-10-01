import React from 'react';
import {Box, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import useMatchStore from "@/app/store/matchStore";

export default function TotalScoreSection() {
    const {team1TotalPoints, team2TotalPoints} = useMatchStore();

    return (<Grid container justifyContent="space-between" alignItems="center" spacing={6} >
            <Grid item size={{xs: 6}}>
                <Grid container direction="column" alignItems="center">
                    <Box
                        sx={{
                            backgroundColor: 'team1.main',
                            color: "team1.contrastText",
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                        <Typography variant="h6" color="#fff">0</Typography>
                    </Box>
                    <Typography variant="h1" fontWeight="bold">{team1TotalPoints}</Typography>
                    <Typography variant="h6">MI</Typography>
                </Grid>
            </Grid>
            <Grid item size={{xs: 6}}>
                <Grid container direction="column" alignItems="center">
                    <Box sx={{
                        backgroundColor: 'team2.main',
                        color: "team2.contrastText",
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6" color="#fff">0</Typography>
                    </Box>
                    <Typography variant="h1" fontWeight="bold">{team2TotalPoints}</Typography>
                    <Typography variant="h6">VI</Typography>
                </Grid>
            </Grid>
        </Grid>
    );
}