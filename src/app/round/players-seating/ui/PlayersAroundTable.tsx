"use client";

import React from "react";
import {Box, Typography} from "@mui/material";
import usePlayerPairStore from "@/app/store/playerPairStore";
import {Grid} from "@mui/system";
import theme from "@/app/styles/theme";


export default function PlayersAroundTable() {
    const {playerPair1, playerPair2} = usePlayerPairStore();
    //const dealerIndex = useMemo(() => Math.floor(Math.random() * 4), []);

    const players = [
        {...playerPair1.player1, justify: "flex-start", align: "flex-start",  color: "team1.main"},
        {...playerPair2.player1, justify: "flex-end",align: "flex-start", color: "team2.main"},
        {...playerPair2.player2, justify: "flex-start",align: "flex-end", color: "team2.main"},
        {...playerPair1.player2, justify: "flex-end", align: "flex-end",color: "team1.main"},
    ];

    return (
            <Grid container spacing={2} sx={{position: "relative", width: "100%", height: "400px"}}>
                {players.map((player) => (
                    <Grid
                        key={player.id}
                        item
                        size={{xs: 6}}
                        sx={{display: "flex", justifyContent: player.justify, alignItems:player.align}}
                    >
                        <PlayerBox
                            playerName={player.username}
                            color={player.color}
                        />
                    </Grid>
                ))}
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
                            width: "200px",
                            height: "200px",
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

function PlayerBox({playerName, color}: { playerName: string; color: string }) {
    return (
        <Box
            sx={{
                backgroundColor: color,
                color: theme.palette.background.default,
                width: "100px",
                height: "100px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Typography variant="h7" fontFamily={theme.typography.fontFamily}>{playerName}</Typography>
        </Box>
    );
}
