"use client";

import React from "react";
import PlayersAroundTable from "@/app/round/ui/PlayersAroundTable";
import {Box, Typography} from "@mui/material";
import ActionButtons from "@/app/round/ui/ActionButtons";
import {useParams} from "next/navigation";
import useRoundStore from "@/app/store/RoundStore";

export default function PlayersSeating() {
    const params = useParams();
    const roundId = params.roundId;

    const setRoundData = useRoundStore((state) => state.setRoundData);

    React.useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const response = await fetch(`/api/rounds/${roundId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch team data');
                }
                const data = await response.json();
                setRoundData(data);
            } catch (error) {
                console.error('Error fetching team data:', error);
            }
        };

        fetchTeamData();
    }, [roundId]);

    return (
        <>
            <Box sx={{gridArea: "top", alignSelf: "center"}}>
                <Typography variant="h4" align="center" fontWeight="bold">Raspored sjedenja</Typography>
            </Box>
            <Box sx={{gridArea: "body", alignSelf: "start"}}>
                <PlayersAroundTable/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "end"}}>
                <ActionButtons/>
            </Box>
        </>
    );
}
