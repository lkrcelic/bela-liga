"use client";

import {Box} from "@mui/material";
import ActionsButtons from "@/app/match/result/ui/ActionsButtons";
import TeamsScoreSection from "@/app/match/result/ui/TeamsScoreSection";

export default function Layout({children}) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                gridTemplateAreas: `
                    "score"
                    "children"
                    "actions"
                `,
                height: "85vh",
                paddingX: 2,
                paddingTop: 1,
                gap: 4,
            }}
        >
            <Box sx={{gridArea: "score", alignSelf: "end"}}>
                <TeamsScoreSection/>
            </Box>
            <Box sx={{gridArea: "children", alignSelf: "end"}}>
                {children}
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <ActionsButtons/>
            </Box>
        </Box>
    );
}

