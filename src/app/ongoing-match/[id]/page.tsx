"use client";

import React from 'react';
import {Box} from '@mui/material';
import TotalScoreSection from "@/app/ongoing-match/ui/TotalScoreSection";
import ResultsDisplay from "@/app/ongoing-match/ui/ResultsDisplay";
import Action from "@/app/ongoing-match/ui/Action";
import CardDealer from "@/app/ongoing-match/ui/CardDealer";

const MobileScoreBoard = () => {
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