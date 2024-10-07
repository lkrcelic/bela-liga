import React from "react";
import {Box} from "@mui/material";
import {Player} from "@/app/types/types";
import {Grid} from "@mui/system";

type PlayersContainerProps = {
    playerPair1: { player1: Player; player2: Player; };
    playerPair2: { player1: Player; player2: Player; };
    children: (player: Player) => React.ReactNode;
};

export default function PlayersContainer({playerPair1, playerPair2, children}: PlayersContainerProps) {
    const players = [playerPair1.player1, playerPair2.player1, playerPair1.player2, playerPair2.player2]

    return (
        <Box sx={{alignItems: "center"}}>
            <Grid container rowSpacing={2}>
                {players.map((player, index) => (
                    <Grid
                        key={player.id}
                        item
                        size={{xs: 6, sm: 6, md: 6}}
                        sx={{
                            display: "flex",
                            justifyContent: index % 2 ? "flex-end" : "flex-start",
                        }}
                    >
                        {children(player)}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
