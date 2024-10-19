"use client";

import React from "react";
import {Box} from "@mui/material";
import AnnouncementSection from "@/app/ongoing-match/[matchId]/ongoing-result/announcement/ui/AnnouncementsSection";
import PlayersAnnouncementSection
    from "@/app/ongoing-match/[matchId]/ongoing-result/announcement/ui/PlayersAnnouncementSection";
import ActionButtons from "@/app/ongoing-match/[matchId]/ongoing-result/announcement/ui/ActionButtons";

export default function Result() {
    return (
        <>
            <Box sx={{gridArea: "body", alignSelf: "end"}}>
                <AnnouncementSection/>
                <PlayersAnnouncementSection/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <ActionButtons/>
            </Box>
        </>
    );
}
