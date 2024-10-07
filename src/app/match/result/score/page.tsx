"use client";

import React from "react";
import DigitGrid from "@/app/match/result/score/ui/DigitGrid";
import {Box} from "@mui/material";
import ActionButtons from "@/app/match/result/score/ui/ActionButtons";

export default function Result() {
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
