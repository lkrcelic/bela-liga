"use client";

import React from "react";
import PlayersAnnouncementSection from "@/app/match/result/announcement/ui/PlayersAnnouncementSection";
import AnnouncementSection from "@/app/match/result/announcement/ui/AnnouncementsSection";

export default function Result() {
  return (
    <>
      <AnnouncementSection />
      <PlayersAnnouncementSection />
    </>
  );
}
