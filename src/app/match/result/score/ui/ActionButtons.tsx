"use client";

import useAnnouncementStore from "@/app/store/bela/announcementStore";
import useResultStore from "@/app/store/bela/resultStore";
import useMatchStore from "@/app/store/matchStore";
import {useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";


export default function ActionButtons() {
    const {
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
    const resultStoreState = useResultStore.getState?.();


    const router = useRouter();

    const handleSave = async () => {

        addResult({
            playerPair1ResultPoints: playerPair1TotalPoints,
            playerPair2ResultPoints: playerPair2TotalPoints,
            playerPair1ResultAnnouncements: player_pair1_announcement_points,
            playerPair2ResultAnnouncements: player_pair2_announcement_points,
        });
        resetResult();
        resetAnnouncements();

        // Make the POST request with the Zustand state as the body
        try {
            const response = await fetch("/api/belaResult", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({...resultStoreState, match_id: 2}),
            });

            if (!response.ok) {
                throw new Error(`Failed to send store state: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Response from the server:", data);
        } catch (error) {
            console.error("Error sending Zustand state:", error);
        }

        router.push("/match");
    };


    return <DoubleActionButton
        secondButtonLabel={"Spremi"}
        secondButtonOnClick={handleSave}
        secondButtonDisabled={player_pair1_game_points === 0 && player_pair2_game_points === 0}
    />

}