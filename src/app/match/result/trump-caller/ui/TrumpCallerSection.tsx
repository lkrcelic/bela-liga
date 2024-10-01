"use client";

import React from "react";
import {Button, Typography} from "@mui/material";
import {Player} from "@/app/types/types";
import PlayersContainer from "@/app/match/result/ui/PlayersContainer";
import useResultStore from "@/app/store/resultStore";

export default function TrumpCallerSection() {
    const players: Player[] = [
        {id: 1, name: "Player 1", color: "team1"},
        {id: 2, name: "Player 2", color: "team2"},
        {id: 3, name: "Player 3", color: "team1"},
        {id: 4, name: "Player 4", color: "team2"},
    ];

    const {trumpCallerId, setTrumpCallerId} = useResultStore();

    return (
        <PlayersContainer players={players}>
            {(player) => (
                <PlayerBox
                    key={player.id}
                    playerName={player.name}
                    color={player.color}
                    onClick={() => setTrumpCallerId(player.id)}
                    isTrumpCaller={player.id === trumpCallerId}
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

function PlayerBox({playerName, color, isTrumpCaller, onClick}: PlayerBoxProps) {
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
