"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {useRouter} from "next/navigation";
import useResultStore from "@/app/store/bela/resultStore";


export default function ActionButtons() {
    const {trump_caller_id} = useResultStore();
    const router = useRouter();

    return <DoubleActionButton secondButtonOnClick={() => router.push("/match")}
                               secondButtonLabel="Započni rundu"/>

}