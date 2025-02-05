import React from 'react';
import {Box, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import useRoundStore from "@/app/_store/RoundStore";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";

export default function TotalScoreSection() {
    const {ongoingMatch: {player_pair1_score, player_pair2_score}} = useOngoingMatchStore();
    const {roundData: {team1_wins, team2_wins, team1, team2}} = useRoundStore();

    return (<Grid container justifyContent="space-between" alignItems="center" spacing={6}>
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
                        <Typography variant="h6" color="#fff">{team1_wins}</Typography>
                    </Box>
                    <Typography variant="h1" fontWeight="bold">{player_pair1_score}</Typography>
                    <Typography variant="h7">{team1?.team_name}</Typography>
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
                        <Typography variant="h6" color="#fff">{team2_wins}</Typography>
                    </Box>
                    <Typography variant="h1" fontWeight="bold">{player_pair2_score}</Typography>
                    <Typography variant="h7">{team2?.team_name}</Typography>
                </Grid>
            </Grid>
        </Grid>
    );
}