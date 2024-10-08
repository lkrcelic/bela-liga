"use client";

import {Box} from "@mui/material";
import TeamsScoreSection from "@/app/match/result/ui/TeamsScoreSection";
import React from "react";

export default function Layout({children}) {
    return (
        <>
            <Box sx={{gridArea: "top", alignSelf: "end"}}>
                <TeamsScoreSection/>
            </Box>
            {children}
        </>
    );
}

