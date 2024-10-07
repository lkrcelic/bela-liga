"use client";

import {usePathname, useRouter} from "next/navigation";
import {Button} from "@mui/material";
import {Grid} from "@mui/system";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import useMatchStore from "@/app/store/matchStore";
import useResultStore from "@/app/store/bela/resultStore";
import DoubleActionButton from "@/app/ui/doubleActionButton";

export default function ActionsButtons() {
    const {noAnnouncements} = useAnnouncementStore();
    const {
        trump_caller_id,
        player_pair1_game_points,
        player_pair2_game_points,
        player_pair1_announcement_points,
        player_pair2_announcement_points,
        playerPair1TotalPoints,
        playerPair2TotalPoints,
        resetResult,
    } = useResultStore();
    const {addResult} = useMatchStore();
    const {resetAnnouncements} = useAnnouncementStore();

    const pathname = usePathname();
    const router = useRouter();

    const getProps = () => {
        switch (pathname) {
            case "/match/result/trump-caller":
                return {
                    label: "Dalje",
                    disabled: trump_caller_id === undefined,
                    onClick: () => {
                        router.push("/match/result/announcement");
                    },
                };
            case "/match/result/announcement":
                return {
                    label: noAnnouncements ? "Nema Zvanja" : "Dalje",
                    disabled: false,
                    onClick: () => {
                        router.push("/match/result/score");
                    },
                };
            case "/match/result/score":
                return {
                    label: "Spremi",
                    disabled: player_pair1_game_points === 0 && player_pair2_game_points === 0,
                    onClick: () => {
                        addResult({
                            playerPair1ResultPoints: playerPair1TotalPoints,
                            playerPair2ResultPoints: playerPair2TotalPoints,
                            playerPair1ResultAnnouncements: player_pair1_announcement_points,
                            playerPair2ResultAnnouncements: player_pair2_announcement_points,
                        });
                        resetResult();
                        resetAnnouncements();
                        router.push("/match");
                    },
                };
        }
    };

    const props = getProps();

    return <DoubleActionButton secondLabel={props.label} secondOnClick={props.onClick} secondDisabled={props.disabled}/>
}
