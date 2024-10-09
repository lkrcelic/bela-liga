import React from 'react';
import {useRouter} from "next/navigation";
import useMatchStore from "@/app/store/matchStore";
import useRoundStore from "@/app/store/RoundStore";
import useResultStore from "@/app/store/bela/resultStore";
import SingleActionButton from "@/app/ui/singeActionButton";

export default function Action() {
    const {player_pair1_total_points, player_pair2_total_points, resetMatch} = useMatchStore();
    const {addMatch} = useRoundStore();
    const {resetResult} = useResultStore();
    const router = useRouter();

    const getProps = () => {
        if (player_pair1_total_points >= 1001 || player_pair2_total_points >= 1001) {
            return {
                label: "Završi meč",
                onClick: () => {
                    addMatch({ player_pair1_total_points, player_pair2_total_points});
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
