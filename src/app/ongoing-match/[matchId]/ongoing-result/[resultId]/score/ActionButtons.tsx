"use client";

import useAnnouncementStore from "@/app/store/bela/announcementStore";
import useResultStore from "@/app/store/bela/resultStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";

export default function ActionButtons() {
    const {
        resultData,
        resetResult,
        setTotalPoints,
        setCardShufflerIdAndTrumpCallerPosition,
    } = useResultStore();
    const {
        ongoingMatch: {
            playerPair1,
            playerPair2,
            seating_order,
            current_shuffler_index,
        },
    } = useOngoingMatchStore();
    const {resetAnnouncements} = useAnnouncementStore();

    const router = useRouter();
    const {matchId} = useParams();

    const handleSave = async () => {
        setTotalPoints(playerPair1, playerPair2);
        setCardShufflerIdAndTrumpCallerPosition(seating_order!, current_shuffler_index!);
        const updatedResultData = useResultStore.getState?.().resultData;

        try {
            const response = await fetch("/api/belaResult", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({...updatedResultData}),
            });

            if (!response.ok) {
                throw new Error(`Failed to send store state: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error sending Zustand state:", error);
        }

        resetResult();
        resetAnnouncements();

        router.push(`/ongoing-match/${matchId}`);
    };

    return <DoubleActionButton
        secondButtonLabel={"Spremi"}
        secondButtonOnClick={handleSave}
        secondButtonDisabled={resultData.player_pair1_game_points === 0 && resultData.player_pair2_game_points === 0}
    />

}