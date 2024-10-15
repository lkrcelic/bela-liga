import React, {useState} from 'react';
import {Button, Menu, MenuItem} from '@mui/material';
import {PlayerType, TeamPlayersType} from "@/app/lib/interfaces/round";
import {Grid} from "@mui/system";

type PlayerPairSelectorProps = {
    team1Players: TeamPlayersType | undefined;
    team2Players: TeamPlayersType | undefined;
};

export default function PlayerPairSelector({team1Players, team2Players}: PlayerPairSelectorProps) {
    const [team1Player1, setTeam1Player1] = useState<PlayerType | null>(null);
    const [team1Player2, setTeam1Player2] = useState<PlayerType | null>(null);

    const [team2Player1, setTeam2Player1] = useState<PlayerType | null>(null);
    const [team2Player2, setTeam2Player2] = useState<PlayerType | null>(null);

    return (
        <>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-start", alignItems: "flex-start"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={team1Player1}
                    setSelectedPlayer={setTeam1Player1}
                    selectedTeammate={team1Player2}
                    teamPlayers={team1Players || []}
                    color="team1"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-end", alignItems: "flex-start"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={team2Player1}
                    setSelectedPlayer={setTeam2Player1}
                    selectedTeammate={team2Player2}
                    teamPlayers={team2Players || []}
                    color="team2"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-start", alignItems: "flex-end"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={team2Player2}
                    setSelectedPlayer={setTeam2Player2}
                    selectedTeammate={team2Player1}
                    teamPlayers={team2Players || []}
                    color="team2"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-end", alignItems: "flex-end"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={team1Player2}
                    setSelectedPlayer={setTeam1Player2}
                    selectedTeammate={team1Player1}
                    teamPlayers={team1Players || []}
                    color="team1"
                />
            </Grid>
        </>
    );
};


type PlayerSelectorProps = {
    selectedPlayer: PlayerType | null;
    setSelectedPlayer: React.Dispatch<React.SetStateAction<PlayerType | null>>;
    selectedTeammate: PlayerType | null;
    color: 'team1' | 'team2';
    teamPlayers: TeamPlayersType;
}

function TeamPlayerSelector({
                                selectedPlayer,
                                setSelectedPlayer,
                                selectedTeammate,
                                color,
                                teamPlayers,
                            }: PlayerSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (playerId: number) => {
        if (playerId === -1) {
            setSelectedPlayer(null);
        } else {
            const player = teamPlayers.find((p) => p.player.id === playerId)?.player || null;
            if (player) {
                setSelectedPlayer(player);
            }
        }
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                variant={(selectedPlayer ? 'contained' : 'outlined') as 'contained' | 'outlined'}
                onClick={handleButtonClick}
                color={color}
                sx={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '8px',
                }}
            >
                {selectedPlayer ? selectedPlayer.username : "Izaberi igrača"}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        style: {
                            maxHeight: 100,
                            width: '20ch',
                            overflowY: 'auto',
                        },
                    },
                }}
            >
                <MenuItem key="empty-option" onClick={() => handleMenuItemClick(-1)}>
                    Obriši
                </MenuItem>
                {teamPlayers.filter((player) => !(selectedTeammate && selectedTeammate.id === player.player.id))
                    .map((player) => (
                        <MenuItem
                            key={player.player.id}
                            onClick={() => handleMenuItemClick(player.player.id)}
                        >
                            {player.player.username}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
};
