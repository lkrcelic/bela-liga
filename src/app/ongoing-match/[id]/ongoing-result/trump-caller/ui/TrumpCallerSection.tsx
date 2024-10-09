"use client";

import React from "react";
import PlayersContainer from "@/app/ongoing-match/ongoing-result/ui/PlayersContainer";
import useResultStore from "@/app/store/bela/resultStore";
import usePlayerPairStore from "@/app/store/playerPairStore";
import {Button, Typography} from "@mui/material";

export default function TrumpCallerSection() {
    const {playerPair1, playerPair2} = usePlayerPairStore();
    const {trump_caller_id, setTrumpCallerId} = useResultStore();

    return (
        <PlayersContainer playerPair1={playerPair1} playerPair2={playerPair2}>
            {(player) => (
                <TrumpCallerButton
                    key={player.id}
                    playerName={player.username}
                    color={player === playerPair1.player1 || player === playerPair1.player2 ? "team1" : "team2"}
                    onClick={() => setTrumpCallerId(player.id)}
                    isTrumpCaller={player.id === trump_caller_id}
                />
            )}
        </PlayersContainer>
    );
}

type PlayerBoxProps = {
    playerName: string;
    color: string;
    isTrumpCaller: boolean;
    onClick?: () => void;
};

function TrumpCallerButton({playerName, color, isTrumpCaller, onClick}: PlayerBoxProps) {
    return (
        <Button
            onClick={onClick}
            color={color}
            variant={(isTrumpCaller ? 'contained' : 'outlined') as 'contained' | 'outlined'}
            sx={{
                width: "100px",
                height: "100px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <Typography variant="h7">{playerName}</Typography>
        </Button>
    );
}
