import React from "react";
import useAnnouncementStore from "@/app/store/announcementStore";
import {Player} from "@/app/types/types";
import PlayersContainer from "@/app/match/result/ui/PlayersContainer";
import {Button, Typography} from "@mui/material";

export default function PlayersAnnouncementSection() {
    const players: Player[] = [
        {id: 1, name: "Player 1", color: "team1"},
        {id: 2, name: "Player 2", color: "team2"},
        {id: 3, name: "Player 3", color: "team1"},
        {id: 4, name: "Player 4", color: "team2"},
    ];

    const {
        playerAnnouncements,
        activePlayerId,
        setActivePlayerId,
    } = useAnnouncementStore();

    return (
        <PlayersContainer players={players}>
            {(player) => (
                <PlayerAnnouncementBox
                    key={player.id}
                    playerName={player.name}
                    announcementValue={
                        playerAnnouncements[player.id]?.totalAnnouncements || 0
                    }
                    teamColor={player.color}
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
