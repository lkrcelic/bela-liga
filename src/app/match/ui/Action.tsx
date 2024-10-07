import React from 'react';
import {useRouter} from "next/navigation";
import useMatchStore from "@/app/store/matchStore";
import useRoundStore from "@/app/store/RoundStore";
import useResultStore from "@/app/store/bela/resultStore";
import SingleActionButton from "@/app/ui/singeActionButton";

export default function Action() {
    const {team1TotalPoints, team2TotalPoints, resetMatch} = useMatchStore();
    const {addMatch} = useRoundStore();
    const {resetResult} = useResultStore();
    const router = useRouter();

    const getProps = () => {
        if (team1TotalPoints >= 1001 || team2TotalPoints >= 1001) {
            return {
                label: "Završi meč",
                onClick: () => {
                    addMatch({team1TotalPoints: playerPair1TotalPoints, team2TotalPoints: playerPair2TotalPoints});
                    resetMatch();
                    resetResult();
                },

            }
        } else {
            return {
                label: "Upiši igru",
                onClick: () => {
                    router.push("/match/result/trump-caller");
                },
            }
        }
        //TODO dodati kada oboje prijeđu 1001
    };

    const props = getProps();

    return <SingleActionButton label={props.label} onClick={props.onClick}/>
}
