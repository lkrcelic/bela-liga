"use client";

import React from "react";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import {Button, Typography} from "@mui/material";
import usePlayerPairStore from "@/app/store/playerPairStore";
import PlayersContainer from "@/app/ongoing-match/[matchId]/ongoing-result/ui/PlayersContainer";

export default function PlayersAnnouncementSection() {
    const {
        playerAnnouncements,
        activePlayerId,
        setActivePlayerId,
    } = useAnnouncementStore();
    const {playerPair1, playerPair2} = usePlayerPairStore();

    return (
        <PlayersContainer playerPair1={playerPair1} playerPair2={playerPair2}>
            {(player) => (
                <PlayerAnnouncementBox
                    key={player.id}
                    playerName={player.username}
                    announcementValue={
                        playerAnnouncements[player.id]?.totalAnnouncements || 0
                    }
                    teamColor={player === playerPair1.player1 || player === playerPair1.player2 ? "team1" : "team2"}
                    isActive={activePlayerId === player.id}
                    onClick={() => setActivePlayerId(player.id)}
                />
            )}
        </PlayersContainer>
    );
}

type AnnouncementBoxProps = {
    playerName: string;
    announcementValue: number | string;
    teamColor: string;
    isActive: boolean;
    onClick?: () => void;
};

function PlayerAnnouncementBox({
                                   playerName,
                                   announcementValue,
                                   teamColor,
                                   onClick,
                                   isActive
                               }: AnnouncementBoxProps) {
    return (
        <Button
            onClick={onClick}
            color={teamColor}
            variant={(isActive ? 'contained' : 'outlined') as 'contained' | 'outlined'}
            sx={{
                width: "100px",
                height: "100px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
            }}
        >
            <Typography variant="h7">{playerName}</Typography>
            <Typography variant="h6">{announcementValue}</Typography>
        </Button>
    );
}
