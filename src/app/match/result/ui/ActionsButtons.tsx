"use client";

import {usePathname, useRouter} from "next/navigation";
import {Button} from "@mui/material";
import {Grid} from "@mui/system";
import useAnnouncementStore from "@/app/store/announcementStore";
import useMatchStore from "@/app/store/matchStore";
import useResultStore from "@/app/store/resultStore";

export default function ActionsButtons() {
    const {noAnnouncements} = useAnnouncementStore();
    const {
        trumpCallerId,
        stigljaActive,
        team1TotalPoints,
        team2TotalPoints,
        team1AnnouncementPoints,
        team2AnnouncementPoints,
        team1GamePoints,
        team2GamePoints,
        resetResult,
    } = useResultStore();
    const {addResult} = useMatchStore();
    const {resetAnnouncements} = useAnnouncementStore();

    const pathname = usePathname();
    const router = useRouter();

    const getNextAction = () => {
        switch (pathname) {
            case "/match/result/trump-caller":
                return {
                    label: "Dalje",
                    disabled: trumpCallerId === null,
                    action: () => {
                        router.push("/match/result/announcement");
                    },
                };
            case "/match/result/announcement":
                return {
                    label: noAnnouncements ? "Nema Zvanja" : "Dalje",
                    disabled: false,
                    action: () => {
                        router.push("/match/result/score");
                    },
                };
            case "/match/result/score":
                return {
                    label: "Spremi",
                    disabled: team1GamePoints === 0 && team2GamePoints === 0,
                    action: () => {
                        addResult({
                            stigljaActive,
                            team1TotalPoints,
                            team2TotalPoints,
                            team1AnnouncementPoints,
                            team2AnnouncementPoints,
                        });
                        resetResult();
                        resetAnnouncements();
                        router.push("/match");
                    },
                };
        }
    };

    const nextAction = getNextAction();

    return (
        <Grid container spacing={2} sx={{width: "100%"}}>
            <Grid item size={{xs: 6}}>
                <Button
                    color="primary"
                    variant="outlined"
                    sx={{width: "100%", fontSize: "16px"}}
                    onClick={() => {
                        window.history.back();
                    }}
                >
                    Nazad
                </Button>
            </Grid>
            <Grid item size={{xs: 6}}>
                <Button
                    color="primary"
                    variant="contained"
                    sx={{width: "100%", fontSize: "16px"}}
                    onClick={nextAction.action}
                    disabled={nextAction.disabled}
                >
                    {nextAction.label}
                </Button>
            </Grid>
        </Grid>
    );
}
