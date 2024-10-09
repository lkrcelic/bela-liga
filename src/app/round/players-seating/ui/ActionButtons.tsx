"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import {MatchTeamPlayersType} from "@/app/lib/interfaces/match";

export default function ActionButtons() {
    const router = useRouter();
    let matchId;

    const startMatch = async () => {
        try {
            const response = await fetch("/api/matches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
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
            matchId = data.match.id;
            console.log("Response from the server:", data);
        } catch (error) {
            console.error("Error sending Zustand state:", error);
        }

        router.push(`/ongoing-match/${matchId}`);
    }

    return <DoubleActionButton secondButtonOnClick={startMatch} secondButtonLabel="Započni rundu"/>

}
