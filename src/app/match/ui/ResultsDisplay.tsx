import React from 'react';
import {Typography} from '@mui/material';
import {Grid} from "@mui/system";
import useMatchStore from "@/app/store/matchStore";

export default function ResultsDisplay() {
    const {results} = useMatchStore();

    return (
            <Grid container spacing={2} justifyContent="center">
                {results.map((result, index) => (
                    <Grid key={index} container item size={{ xs: 10 }} justifyContent="space-evenly" alignItems="center"
                          sx={{ backgroundColor: "secondary.main", borderRadius: "20px" }}>
                        <Grid item size={{ xs: 4 }}>
                            <Typography variant="h4" textAlign="center">
                                {result.team1Points}
                            </Typography>
                        </Grid>

                        <Grid item size={{ xs: 2 }}>
                            <Typography variant="h4" textAlign="center">
                                •
                            </Typography>
                        </Grid>

                        <Grid item size={{ xs: 4 }}>
                            <Typography variant="h4" textAlign="center">
                                {result.team2Points}
                            </Typography>
                        </Grid>
                    </Grid>
                ))}
            </Grid>
    );
}
