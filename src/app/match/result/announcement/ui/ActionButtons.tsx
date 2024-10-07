"use client";

import DoubleActionButton from "@/app/ui/DoubleActionButton";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import {useRouter} from "next/navigation";


export default function ActionButtons() {
    const {noAnnouncements} = useAnnouncementStore();
    const router = useRouter();


    return <DoubleActionButton
        secondButtonLabel={noAnnouncements ? "Nema Zvanja" : "Dalje"}
        secondButtonOnClick={() => router.push("/match/result/score")}
        secondButtonDisabled={false}
    />

}