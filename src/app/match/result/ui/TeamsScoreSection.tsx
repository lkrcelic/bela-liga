import React from "react";
import {Grid} from "@mui/system";
import {TeamScoreBox} from "@/app/match/result/ui/TeamScoreBox";
import useResultStore from "@/app/store/resultStore";
import {usePathname} from "next/navigation";

type ScoreSectionType = {
    team1Color: string;
    team2Color: string;
    team1Value: string | number;
    team2Value: string | number;
    team1SecondValue: string | number;
    team2SecondValue: string | number;
    textVariant: "h4" | "h5";
    label: string | undefined;
    onClick: null | ((team: "team1" | "team2") => void);
    team1ButtonVariant: "contained" | "outlined";
    team2ButtonVariant: "contained" | "outlined";
};

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

    const getScoreSectionType = ():ScoreSectionType => {
        switch (pathname) {
            case "/match/result/trump-caller":
                return {
                    team1Color: "team1",
                    team2Color: "team2",
                    team1Value: "Team 1",
                    team2Value: "Team 2",
                    team1SecondValue: "",
                    team2SecondValue: "",
                    textVariant: "h5",
                    team1ButtonVariant: "contained",
                    team2ButtonVariant: "contained",
                    label: undefined,
                    onClick: null,
                };
            case "/match/result/announcement":
                return {
                    team1Color: "team1",
                    team2Color: "team2",
                    team1Value: team1AnnouncementPoints,
                    team2Value: team2AnnouncementPoints,
                    team1SecondValue: "",
                    team2SecondValue: "",
                    textVariant: "h4",
                    label: "Zvanja",
                    team1ButtonVariant: "contained",
                    team2ButtonVariant: "contained",
                    onClick: null,
                };
            case "/match/result/score":
                return {
                    team1Color: "team1",
                    team2Color: "team2",
                    team1Value: team1GamePoints,
                    team2Value: team2GamePoints,
                    team1SecondValue: team1GamePoints + team1AnnouncementPoints,
                    team2SecondValue: team2GamePoints + team2AnnouncementPoints,
                    textVariant: "h4",
                    team1ButtonVariant: activeTeam === "team1" ? "contained" : "outlined",
                    team2ButtonVariant: activeTeam === "team2" ? "contained" : "outlined",
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
        >
            <Grid item size={{xs: 6}}>
                <TeamScoreBox
                    label={scoreSectionType.label}
                    teamColor={scoreSectionType.team1Color}
                    value={String(scoreSectionType.team1Value)}
                    setActiveTeam={() => scoreSectionType.onClick?.("team1")}
                    textVariant={scoreSectionType.textVariant}
                    secondValue={String(scoreSectionType?.team1SecondValue)}
                    isActive={activeTeam === "team1"}
                    buttonVariant={scoreSectionType.team1ButtonVariant}
                />
            </Grid>

            <Grid item size={{xs: 6}}>
                <TeamScoreBox
                    label={scoreSectionType.label}
                    teamColor={scoreSectionType.team2Color}
                    value={String(scoreSectionType.team2Value)}
                    setActiveTeam={() => scoreSectionType.onClick?.("team2")}
                    textVariant={scoreSectionType.textVariant}
                    secondValue={String(scoreSectionType?.team2SecondValue)}
                    isActive={activeTeam === "team2"}
                    buttonVariant={scoreSectionType.team2ButtonVariant}
                />
            </Grid>
        </Grid>
    );
}
