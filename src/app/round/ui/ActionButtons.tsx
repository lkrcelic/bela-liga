"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import React from "react";
import useMatchStore from "@/app/store/matchStore";

export default function ActionButtons() {
    const router = useRouter();
    const playersSeatingOrder = useMatchStore(state => state.playersSeatingOrder)

    const startMatch = async () => {
        try {
            const response = await fetch("/api/ongoing-matches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    player_pair1: {
                        player_id1: playersSeatingOrder[0]?.id,
                        player_id2: playersSeatingOrder[2]?.id,
                    },
                    player_pair2: {
                        player_id1: playersSeatingOrder[1]?.id,
                        player_id2: playersSeatingOrder[3]?.id,
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to send store state: ${response.statusText}`);
            }

            const data = await response.json();
            router.push(`/ongoing-match/${data.match.id}`);
        } catch (error) {
            console.error("Error sending Zustand state:", error);
        }
    }

    return <DoubleActionButton secondButtonOnClick={startMatch} secondButtonLabel="Započni rundu"/>

}
