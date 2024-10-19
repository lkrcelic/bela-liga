import React from "react";
import {Box, Typography} from "@mui/material";
import TrumpCallerSection from "@/app/ongoing-match/[matchId]/ongoing-result/trump-caller/ui/TrumpCallerSection";
import ActionButtons from "@/app/ongoing-match/[matchId]/ongoing-result/trump-caller/ui/ActionButtons";

export default function Result() {
    return (
        <>
            <Box sx={{gridArea: "body", alignSelf: "end"}}>
                <Typography variant="h4" color="black" align="center" paddingBottom={12}>Izaberi tko je
                    zvao</Typography>
                <TrumpCallerSection/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <ActionButtons/>
            </Box>
        </>);
}
