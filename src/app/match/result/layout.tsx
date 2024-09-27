"use client";

import React from "react";
import {Box} from "@mui/material";
import ActionsButtons from "@/app/match/result/ui/ActionsButtons";
import TeamsScoreSection from "@/app/match/result/ui/TeamsScoreSection";

export default function Layout({children}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                height: "89vh",
                padding: 2,
                backgroundColor: "#fefefe",
            }}
        >
            <TeamsScoreSection/>
            {children}
            <ActionsButtons/>
        </Box>
    );
}
