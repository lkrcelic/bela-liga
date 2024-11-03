"use client";

import DoubleActionButton from "../../../../../ui/DoubleActionButton";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import {useParams, useRouter} from "next/navigation";


export default function ActionButtons() {
    const {noAnnouncements} = useAnnouncementStore();
    const router = useRouter();
    const params = useParams();


    return <DoubleActionButton
        secondButtonLabel={noAnnouncements ? "Nema Zvanja" : "Dalje"}
        secondButtonOnClick={() => router.push(`/ongoing-match/${params.matchId}/ongoing-result/score`)}
        secondButtonDisabled={false}
    />

}