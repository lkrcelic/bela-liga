"use client";

import React from 'react';
import {Box} from '@mui/material';
import TotalScoreSection from "@/app/ongoing-match/ui/TotalScoreSection";
import ResultsDisplay from "@/app/ongoing-match/ui/ResultsDisplay";
import Action from "@/app/ongoing-match/ui/Action";
import CardDealer from "@/app/ongoing-match/ui/CardDealer";
import {useParams} from "next/navigation";
import useMatchStore from "@/app/store/matchStore";

const MobileScoreBoard = () => {
    const {matchId} = useParams();

    const setMatchData = useMatchStore((state) => state.setMatchData);

    React.useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const response = await fetch(`/api/ongoing-matches/${matchId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch team data');
                }
                const data = await response.json();
                setMatchData(data);
            } catch (error) {
                console.error('Error fetching team data:', error);
            }
        };

        fetchTeamData();
    }, [matchId]);

    return (
        <>
            <Box sx={{gridArea: "top", alignSelf: "end"}}>
                <TotalScoreSection/>
                <CardDealer/>
            </Box>
            <Box sx={{gridArea: "body", overflowY: 'auto',}}>
                <ResultsDisplay/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <Action/>
            </Box>
        </>
    );
};

export default MobileScoreBoard;
