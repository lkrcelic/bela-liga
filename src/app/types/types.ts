import {playerOutput} from "@/app/lib/interfaces/player";
import {z} from "zod";

export type PlayerAnnouncements = {
    totalAnnouncements: number;
    announcementCounts: { [key: number]: number };
};

export type Player = z.infer<typeof playerOutput>;