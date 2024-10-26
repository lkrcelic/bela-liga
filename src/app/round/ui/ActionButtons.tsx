"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import React from "react";
import useMatchStore from "@/app/store/matchStore";

export default function ActionButtons() {
    const router = useRouter();
    const seatingOrder = useMatchStore(state => state.matchData.seating_order)

    const startMatch = async () => {
        try {
            const response = await fetch("/api/ongoing-matches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seating_order_ids: seatingOrder?.map((player) => player.id),
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
