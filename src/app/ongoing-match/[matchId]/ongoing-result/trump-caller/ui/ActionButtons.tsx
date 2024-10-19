"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useParams, useRouter} from "next/navigation";
import useResultStore from "@/app/store/bela/resultStore";

export default function ActionButtons() {
    const {resultData: {trump_caller_id}} = useResultStore();
    const router = useRouter();
    const params = useParams();

    return <DoubleActionButton
        secondButtonLabel={"Dalje"}
        secondButtonOnClick={() => router.push(`/ongoing-match/${params.matchId}/ongoing-result/announcement`)}
        secondButtonDisabled={trump_caller_id === undefined}
    />

}
