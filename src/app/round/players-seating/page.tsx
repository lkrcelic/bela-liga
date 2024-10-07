"use client";

import React from "react";
import PlayersAroundTable from "@/app/round/players-seating/ui/PlayersAroundTable";
import {Box, Typography} from "@mui/material";
import {useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";

export default function PlayersSeating() {
    const router = useRouter()

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateRows: "1fr auto 1fr",
                gridTemplateAreas: `
                    "title"
                    "seating"
                    "actions"
                `,
                height: "85vh",
                paddingX: 2,
                paddingTop: 1,
                gap: 4,
            }}
        >
            <Box sx={{gridArea: "title", alignSelf: "center"}}>
                <Typography variant="h3" align="center" fontWeight="bold">Raspored sjedenja</Typography>
            </Box>
            <Box sx={{gridArea: "seating", alignSelf: "start"}}>
                <PlayersAroundTable/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "end"}}>
                <DoubleActionButton secondButtonOnClick={() => router.push("/match")} secondButtonLabel="Započni rundu"/>
            </Box>
        </Box>);
}
