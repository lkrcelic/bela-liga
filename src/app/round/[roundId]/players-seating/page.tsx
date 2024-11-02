"use client";

import React from "react";
import PlayersAroundTable from "@/app/round/ui/PlayersAroundTable";
import {Box, Typography} from "@mui/material";
import ActionButtons from "@/app/round/ui/ActionButtons";
import {useParams} from "next/navigation";
import useRoundStore from "@/app/store/RoundStore";
import {getRoundDataAPI} from "@/app/fetchers/round/getOne";

export default function PlayersSeating() {
    const {roundId} = useParams();

    const setRoundData = useRoundStore((state) => state.setRoundData);

    const fetchTeamData = async () => {
        try {
            const data = await getRoundDataAPI(Number(roundId));
            setRoundData(data);
        } catch (error) {
            console.error('Error fetching round data:', error);
        }
    };

    React.useEffect(() => {
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
