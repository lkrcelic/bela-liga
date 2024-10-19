"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import {MatchTeamPlayersType} from "@/app/lib/interfaces/match";
import React from "react";

export default function ActionButtons() {
    const router = useRouter();

    const startMatch = async () => {
        try {
            const response = await fetch("/api/matches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ //TODO maknuti hardcode
                    players: {
                        team1: {player1Id: 2, player2Id: 3},
                        team2: {player1Id: 4, player2Id: 5}
                    } as MatchTeamPlayersType
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
