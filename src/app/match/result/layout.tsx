"use client";

import {Box} from "@mui/material";
import TeamsScoreSection from "@/app/match/result/ui/TeamsScoreSection";
import React from "react";

export default function Layout({children}) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                gridTemplateAreas: `
                    "top"
                    "body"
                    "actions"
                `,
                height: "85vh",
                paddingX: 2,
                paddingTop: 1,
                gap: 4,
            }}
        >
            <Box sx={{gridArea: "top", alignSelf: "end"}}>
                <TeamsScoreSection/>
            </Box>
            {children}
        </Box>
    );
}

