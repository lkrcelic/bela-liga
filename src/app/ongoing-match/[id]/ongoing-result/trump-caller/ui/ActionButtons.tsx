"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import useResultStore from "@/app/store/bela/resultStore";


export default function ActionButtons() {
    const {trump_caller_id} = useResultStore();
    const router = useRouter();

    return <DoubleActionButton
        secondButtonLabel={"Dalje"}
        secondButtonOnClick={() => router.push("/match/result/announcement")}
        secondButtonDisabled={trump_caller_id === undefined}
    />

}