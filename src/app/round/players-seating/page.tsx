"use client";

import React from "react";
import PlayersAroundTable from "@/app/round/players-seating/ui/PlayersAroundTable";
import {Box, Typography} from "@mui/material";
import {useRouter} from "next/navigation";
import ActionButtons from "@/app/round/players-seating/ui/ActionButtons";

export default function PlayersSeating() {
    const router = useRouter()

    return (
        <>
            <Box sx={{gridArea: "top", alignSelf: "center"}}>
                <Typography variant="h3" align="center" fontWeight="bold">Raspored sjedenja</Typography>
            </Box>
            <Box sx={{gridArea: "body", alignSelf: "start"}}>
                <PlayersAroundTable/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "end"}}>
               <ActionButtons />
            </Box>
        </>
    );
}
