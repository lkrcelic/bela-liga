import React from "react";
import {Grid, typographyVariant} from "@mui/system";
import {TeamScoreBox} from "@/app/match/result/ui/TeamScoreBox";
import useResultStore from "@/app/store/resultStore";
import {usePathname} from "next/navigation";

export default function TeamsScoreSection() {
    const {
        team1GamePoints,
        team2GamePoints,
        team1AnnouncementPoints,
        team2AnnouncementPoints,
        activeTeam,
        setActiveTeam,
    } = useResultStore();
    const pathname = usePathname();

    const getScoreSectionType = () => {
        switch (pathname) {
            case "/match/result/trump-caller":
                return {
                    team1Color: "#4caf50",
                    team2Color: "#f44336",
                    team1Value: "Team 1",
                    team2Value: "Team 2",
                    team1SecondValue: "",
                    team2SecondValue: "",
                    variant: "h5",
                    label: undefined,
                    onClick: null,
                };
            case "/match/result/announcement":
                return {
                    team1Color: "#4caf50",
                    team2Color: "#f44336",
                    team1Value: team1AnnouncementPoints,
                    team2Value: team2AnnouncementPoints,
                    team1SecondValue: "",
                    team2SecondValue: "",
                    variant: "h4",
                    label: "Zvanja",
                    onClick: null,
                };
            case "/match/result/score":
                return {
                    team1Color: activeTeam === "team1" ? "#4caf50" : "#9e9e9e",
                    team2Color: activeTeam === "team2" ? "#f44336" : "#9e9e9e",
                    team1Value: team1GamePoints,
                    team2Value: team2GamePoints,
                    team1SecondValue: team1GamePoints + team1AnnouncementPoints,
                    team2SecondValue: team2GamePoints + team2AnnouncementPoints,
                    variant: "h4",
                    label: "Igra",
                    onClick: setActiveTeam,
                };
        }
    };

    const scoreSectionType = getScoreSectionType();

    return (
        <Grid
            container
            spacing={6}
            alignItems="space-between"
            sx={{width: "100%"}}
            paddingX={1}
        >
            <Grid item size={{xs: 6}}>
                <TeamScoreBox
                    label={scoreSectionType.label}
                    teamColor={scoreSectionType.team1Color}
                    value={String(scoreSectionType.team1Value)}
                    setActiveTeam={() => scoreSectionType.onClick?.("team1")}
                    variant={scoreSectionType.variant}
                    secondValue={String(scoreSectionType?.team1SecondValue)}
                />
            </Grid>

            <Grid item size={{xs: 6}}>
                <TeamScoreBox
                    label={scoreSectionType.label}
                    teamColor={scoreSectionType.team2Color}
                    value={String(scoreSectionType.team2Value)}
                    setActiveTeam={() => scoreSectionType.onClick?.("team2")}
                    variant={scoreSectionType.variant}
                    secondValue={String(scoreSectionType?.team2SecondValue)}
                />
            </Grid>
        </Grid>
    );
}
