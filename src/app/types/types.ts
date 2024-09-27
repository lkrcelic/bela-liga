export type Player = {
    id: number;
    name: string;
    color: string;
};

export type PlayerAnnouncements = {
    totalAnnouncements: number;
    announcementCounts: { [key: number]: number };
};