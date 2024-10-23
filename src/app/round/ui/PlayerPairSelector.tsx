import React, {useState} from 'react';
import {Button, Menu, MenuItem} from '@mui/material';
import {Grid} from "@mui/system";
import useMatchStore from "@/app/store/matchStore";
import useRoundStore from "@/app/store/RoundStore";
import {PlayerPartialResponse} from "@/app/lib/interfaces/player";
import {TeamResponse} from "@/app/lib/interfaces/team";

export default function PlayerPairSelector() {
    const {roundData: {team1, team2}} = useRoundStore();
    const {playersSeatingOrder, setPlayersSeatingOrder} = useMatchStore();

    const handlePlayerSelection = (seatIndex: number) =>
        (player: PlayerPartialResponse | null) => {
            const newSeatingOrder = [...playersSeatingOrder];
            newSeatingOrder[seatIndex] = player;
            setPlayersSeatingOrder(newSeatingOrder);
        };

    return (
        <>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-start", alignItems: "flex-start"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={playersSeatingOrder[0]}
                    setSelectedPlayer={handlePlayerSelection(0)}
                    selectedTeammate={playersSeatingOrder[2]}
                    team={team1 as TeamResponse}
                    color="team1"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-end", alignItems: "flex-start"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={playersSeatingOrder[1]}
                    setSelectedPlayer={handlePlayerSelection(1)}
                    selectedTeammate={playersSeatingOrder[3]}
                    team={team2 as TeamResponse}
                    color="team2"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-start", alignItems: "flex-end"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={playersSeatingOrder[3]}
                    setSelectedPlayer={handlePlayerSelection(3)}
                    selectedTeammate={playersSeatingOrder[1]}
                    team={team2 as TeamResponse}
                    color="team2"
                />
            </Grid>
            <Grid
                item
                size={{xs: 6}}
                sx={{display: "flex", justifyContent: "flex-end", alignItems: "flex-end"}}
            >
                <TeamPlayerSelector
                    selectedPlayer={playersSeatingOrder[2]}
                    setSelectedPlayer={handlePlayerSelection(2)}
                    selectedTeammate={playersSeatingOrder[0]}
                    team={team1 as TeamResponse}
                    color="team1"
                />
            </Grid>
        </>
    );
};


type PlayerSelectorProps = {
    selectedPlayer: PlayerPartialResponse | null;
    setSelectedPlayer: (player: PlayerPartialResponse | null) => void;
    selectedTeammate: PlayerPartialResponse | null;
    color: 'team1' | 'team2';
    team: TeamResponse;
}

function TeamPlayerSelector({
                                selectedPlayer,
                                setSelectedPlayer,
                                selectedTeammate,
                                color,
                                team,
                            }: PlayerSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (player: PlayerPartialResponse | null) => {
        setSelectedPlayer(player);
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
                <MenuItem key="empty-option" onClick={() => handleMenuItemClick(null)}>
                    Obriši
                </MenuItem>
                {team?.teamPlayers.filter((p) => !(selectedTeammate?.id === p.player.id))
                    .map((p) => (
                        <MenuItem
                            key={p.player.id}
                            onClick={() => handleMenuItemClick(p.player)}
                        >
                            {p.player.username}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
};
