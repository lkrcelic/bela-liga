"use client";

import React from "react";
import {Box} from "@mui/material";
import DigitGrid from "@/app/ongoing-match/[matchId]/ongoing-result/ui/DigitGrid";
import ActionButtons from "@/app/ongoing-match/[matchId]/ongoing-result/new/score/ActionButtons";

export default function ScorePage() {
    return (
        <>

            <Box sx={{gridArea: "body", alignSelf: "end"}}>
                <DigitGrid/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <ActionButtons/>
            </Box>
        </>
    );
}
