"use client";

import React from 'react';
import {Box} from '@mui/material';
import TotalScoreSection from "@/app/match/ui/TotalScoreSection";
import ResultsDisplay from "@/app/match/ui/ResultsDisplay";
import Action from "@/app/match/ui/Action";
import CardDealer from "@/app/match/ui/CardDealer";

const MobileScoreBoard = () => {
    return (
        <Box sx={{
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gridTemplateAreas: `
                    "score"
                    "results"
                    "actions"
                `,
            height: "85vh",
            paddingX: 2,
            paddingTop: 1,
            gap: 3,
        }}>
            <Box sx={{gridArea: "score", alignSelf: "end"}}>
                <TotalScoreSection/>
                <CardDealer/>
            </Box>
            <Box sx={{gridArea: "results"}}>
                <ResultsDisplay/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <Action/>
            </Box>
        </Box>
    );
};

export default MobileScoreBoard;