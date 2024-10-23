"use client";

import useAnnouncementStore from "@/app/store/bela/announcementStore";
import useResultStore from "@/app/store/bela/resultStore";
import useMatchStore from "@/app/store/matchStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";

export default function ActionButtons() {
    const {
        resultData,
        resetResult,
        setTotalPoints,
    } = useResultStore();
    const {matchData: {playerPair1, playerPair2}, addResult} = useMatchStore();
    const {resetAnnouncements} = useAnnouncementStore();

    const router = useRouter();
    const {matchId} = useParams();

    const handleSave = async () => {
        setTotalPoints(playerPair1, playerPair2);
        const updatedResultData = useResultStore.getState?.().resultData;
        addResult(updatedResultData!);
        resetResult();
        resetAnnouncements();

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

        router.push(`/ongoing-match/${matchId}`);
    };


    return <DoubleActionButton
        secondButtonLabel={"Spremi"}
        secondButtonOnClick={handleSave}
        secondButtonDisabled={resultData.player_pair1_game_points === 0 && resultData.player_pair2_game_points === 0}
    />

}