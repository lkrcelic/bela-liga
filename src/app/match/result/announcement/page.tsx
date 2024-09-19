"use client";

import React from "react";
import PlayersSection from "@/app/match/result/announcement/ui/PlayersSection";
import AnnouncementSection from "@/app/match/result/announcement/ui/AnnouncementsSection";

export default function Result() {
  return (
    <>
      <AnnouncementSection />
      <PlayersSection />
    </>
  );
}
