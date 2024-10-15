"use client";

import React from "react";
import {Box, Typography} from "@mui/material";
import {Grid} from "@mui/system";
import useRoundStore from "@/app/store/RoundStore";
import PlayerPairSelector from "@/app/round/ui/PlayerPairSelector";

export default function PlayersAroundTable() {
    const {roundData} = useRoundStore();

    return (
        <Grid container spacing={2} sx={{position: "relative", width: "100%", height: "400px"}}>
            <PlayerPairSelector team1Players={roundData?.team1?.teamPlayers}
                                team2Players={roundData?.team2?.teamPlayers}
            />
            <Grid
                item
                size={{xs: 12}}
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        width: "190px",
                        height: "190px",
                        borderRadius: "50%",
                        backgroundColor: "secondary.main",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h5">Stol</Typography>
                </Box>
            </Grid>
        </Grid>
    );
}
