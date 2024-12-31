import React from "react";
import {Grid} from "@mui/system";
import useResultStore from "@/app/store/bela/resultStore";
import {usePathname} from "next/navigation";
import {TeamScoreBox} from "@/app/ongoing-match/[matchId]/ongoing-result/ui/TeamScoreBox";
import useRoundStore from "@/app/store/RoundStore";

type ScoreSectionType = {
    team1Color: string;
    team2Color: string;
    team1Value: string | number;
    team2Value: string | number;
    team1SecondValue: string | number;
    team2SecondValue: string | number;
    textVariant: "h4" | "h6";
    label: string | undefined;
    onClick: null | ((team: "team1" | "team2") => void);
    team1ButtonVariant: "contained" | "outlined";
    team2ButtonVariant: "contained" | "outlined";
};

export default function TeamsScoreSection() {
    const {
        resultData: {
            player_pair1_game_points,
            player_pair2_game_points,
            player_pair1_announcement_points,
            player_pair2_announcement_points,
            activeTeam,
        },
        setActiveTeam,
    } = useResultStore();
    const {roundData: {team1, team2}} = useRoundStore();
    const pathname = usePathname();

    const getScoreSectionType = (): ScoreSectionType => {
        if (pathname.endsWith("/trump-caller")) {
            return {
                team1Color: "team1",
                team2Color: "team2",
                team1Value: team1?.team_name || "MI",
                team2Value: team2?.team_name || "VI",
                team1SecondValue: "",
                team2SecondValue: "",
                textVariant: "h6",
                team1ButtonVariant: "contained",
                team2ButtonVariant: "contained",
                label: undefined,
                onClick: null,
            };
        } else if (pathname.endsWith("/announcement")) {
            return {
                team1Color: "team1",
                team2Color: "team2",
                team1Value: player_pair1_announcement_points,
                team2Value: player_pair2_announcement_points,
                team1SecondValue: "",
                team2SecondValue: "",
                textVariant: "h4",
                label: "Zvanja",
                team1ButtonVariant: "contained",
                team2ButtonVariant: "contained",
                onClick: null,
            };
        } else if (pathname.endsWith("/score")) {
            return {
                team1Color: "team1",
                team2Color: "team2",
                team1Value: player_pair1_game_points,
                team2Value: player_pair2_game_points,
                team1SecondValue: player_pair1_game_points + player_pair1_announcement_points,
                team2SecondValue: player_pair2_game_points + player_pair2_announcement_points,
                textVariant: "h4",
                team1ButtonVariant: activeTeam === "team1" ? "contained" : "outlined",
                team2ButtonVariant: activeTeam === "team2" ? "contained" : "outlined",
                label: "Igra",
                onClick: setActiveTeam,
            };
        }
    };

    const scoreSectionType = getScoreSectionType();

    console.log(scoreSectionType.team1Value)
    console.log(team1?.team_name)
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
                    onClick={() => scoreSectionType.onClick?.("team1")}
                    textVariant={scoreSectionType.textVariant}
                    secondValue={String(scoreSectionType?.team1SecondValue)}
                    buttonVariant={scoreSectionType.team1ButtonVariant}
                />
            </Grid>

            <Grid item size={{xs: 6}}>
                <TeamScoreBox
                    label={scoreSectionType.label}
                    teamColor={scoreSectionType.team2Color}
                    value={String(scoreSectionType.team2Value)}
                    onClick={() => scoreSectionType.onClick?.("team2")}
                    textVariant={scoreSectionType.textVariant}
                    secondValue={String(scoreSectionType?.team2SecondValue)}
                    buttonVariant={scoreSectionType.team2ButtonVariant}
                />
            </Grid>
        </Grid>
    );
}
