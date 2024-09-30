import React from "react";
import TrumpCallerSection from "@/app/match/result/trump-caller/ui/TrumpCallerSection";
import {Typography} from "@mui/material";

export default function Result() {
    return (
        <>
            <Typography variant="h4" color="black" align="center" paddingBottom={12}>Izaberi tko je zvao</Typography>
            <TrumpCallerSection/>
        </>);
}
