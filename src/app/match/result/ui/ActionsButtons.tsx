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
                    disabled: team1GamePoints === 0 && team2GamePoints === 0,
                    onClick: () => {
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

    const props = getProps();

    return <DoubleActionButton secondLabel={props.label} secondOnClick={props.onClick} secondDisabled={props.disabled}/>
}
