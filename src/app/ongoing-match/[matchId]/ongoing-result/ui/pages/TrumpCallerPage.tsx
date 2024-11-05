"use client"

import React from "react";
import {Box, Typography} from "@mui/material";
import TrumpCallerSection from "@/app/ongoing-match/[matchId]/ongoing-result/ui/TrumpCallerSection";
import useResultStore from "@/app/store/bela/resultStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";

export default function TrumpCallerPage({actionType}: ActionProps) {
    return (
        <>
            <Box sx={{gridArea: "body", alignSelf: "end"}}>
                <Typography variant="h4" color="black" align="center" paddingBottom={12}>
                    Izaberi tko je zvao
                </Typography>
                <TrumpCallerSection/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <ActionButtons actionType={actionType}/>
            </Box>
        </>);
};

export type ActionProps = {
    actionType: "CREATE" | "UPDATE";
}

function ActionButtons({actionType}: ActionProps) {
    const {resultData: {trump_caller_id}} = useResultStore();
    const router = useRouter();
    const params = useParams();

    let href;
    if (actionType === "CREATE") {
        href = `/ongoing-match/${params.matchId}/ongoing-result/new/announcement`
    }
    if (actionType === "UPDATE") {
        href = `/ongoing-match/${params.matchId}/ongoing-result/${params.resultId}/announcement`
    }

    return <DoubleActionButton
        secondButtonLabel={"Dalje"}
        secondButtonOnClick={() => router.push(href)}
        secondButtonDisabled={trump_caller_id === undefined}
    />
}