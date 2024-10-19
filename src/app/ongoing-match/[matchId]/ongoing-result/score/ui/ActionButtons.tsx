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
    } = useResultStore();
    const {addResult} = useMatchStore();
    const {resetAnnouncements} = useAnnouncementStore();

    const router = useRouter();
    const {matchId} = useParams();

    const handleSave = async () => {
        addResult(resultData);
        resetResult();
        resetAnnouncements();

        // Make the POST request with the Zustand state as the body
        try {
            const response = await fetch("/api/belaResult", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({...resultData, match_id: 1}),
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