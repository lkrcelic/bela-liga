"use client";

import {Box} from "@mui/material";
import ActionsButtons from "@/app/match/result/ui/ActionsButtons";
import TeamsScoreSection from "@/app/match/result/ui/TeamsScoreSection";

export default function Layout({ children }) {
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
                height: "89vh",
                padding: 2,
                gap: 4,
                backgroundColor: "#fefefe",
            }}
        >
            <Box sx={{ gridArea: "actions", alignSelf: "start" }}>
                <ActionsButtons />
            </Box>

            <Box sx={{ gridArea: "children", alignSelf: "end"}}>
                {children}
            </Box>

            <Box sx={{ gridArea: "score", alignSelf: "end" }}>
                <TeamsScoreSection />
            </Box>
        </Box>
    );
}

