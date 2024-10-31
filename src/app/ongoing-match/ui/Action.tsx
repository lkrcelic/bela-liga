import React from 'react';
import {useParams, usePathname, useRouter} from "next/navigation";
import useResultStore from "@/app/store/bela/resultStore";
import SingleActionButton from "@/app/ui/singeActionButton";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";

export default function Action() {
    const {ongoingMatch, resetMatch} = useOngoingMatchStore();
    const {setMatchId} = useResultStore();
    const router = useRouter();
    const {matchId} = useParams();
    const pathname = usePathname();


    const getProps = () => {
        if (ongoingMatch.player_pair1_score >= 1001 || ongoingMatch.player_pair2_score >= 1001) {
            return {
                label: "Završi meč",
                onClick: async () => {
                    try {
                        const response = await fetch("/api/matches", {
                            method: "POST",
                            headers: {"Content-type": "application/json"},
                            body: JSON.stringify(Number(matchId))
                        })
                        if (!response.ok) {
                            throw new Error(`Failed to store match: ${response.statusText}`);
                        }

                        const response2 = await fetch("/api/ongoing-matches", {
                            method: "POST",
                            headers: {"Content-type": "application/json"},
                            body: JSON.stringify({
                                seating_order_ids: ongoingMatch.seating_order?.map((player) => player.id),
                                current_shuffler_index: ongoingMatch.current_shuffler_index,
                            }),
                        })
                        if (!response2.ok) {
                            throw new Error(`Failed to create ongoing match: ${response2.statusText}`);
                        }

                        resetMatch();

                        const data = await response2.json();
                        router.push(`/ongoing-match/${data.match.id}`);
                    } catch (error) {
                        console.error("Error: ", error);
                    }
                },

            }
        } else {
            return {
                label: "Upiši igru",
                onClick: () => {
                    setMatchId(Number(matchId));
                    router.push(`${pathname}/ongoing-result/trump-caller`);
                },
            }
        }
        //TODO dodati kada oboje prijeđu 1001
    };

    const props = getProps();

    return <SingleActionButton label={props.label} onClick={props.onClick}/>
}
