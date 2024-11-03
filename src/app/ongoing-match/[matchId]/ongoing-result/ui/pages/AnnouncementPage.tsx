"use client";

import React from "react";
import {Box} from "@mui/material";
import AnnouncementSection from "@/app/ongoing-match/[matchId]/ongoing-result/ui/AnnouncementsSection";
import PlayersAnnouncementSection
    from "@/app/ongoing-match/[matchId]/ongoing-result/ui/PlayersAnnouncementSection";
import ActionButtons from "@/app/ongoing-match/[matchId]/ongoing-result/new/announcement/ActionButtons";

export default function AnnouncementPage() {
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
