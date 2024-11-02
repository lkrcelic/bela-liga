"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useParams, useRouter} from "next/navigation";
import React from "react";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";
import {createOngoingMatchAPI} from "@/app/fetchers/ongoingMatch/create";

export default function ActionButtons() {
    const router = useRouter();
    const {roundId} = useParams();
    const seatingOrder = useOngoingMatchStore(state => state.ongoingMatch.seating_order)

    const startMatch = async () => {
        const data = await createOngoingMatchAPI({
            round_id: Number(roundId),
            seating_order_ids: seatingOrder?.map((player) => player.id),
            current_shuffler_index: 0,
            score_threshold: 1001,
        });

        router.push(`/ongoing-match/${data.id}`);
    }

    return <DoubleActionButton secondButtonOnClick={startMatch} secondButtonLabel="Započni rundu"/>

}
