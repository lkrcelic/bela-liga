"use client";

import {Box} from "@mui/material";
import React from "react";
import {usePathname} from "next/navigation";
import TeamsScoreSection from "@/app/ongoing-match/[matchId]/ongoing-result/ui/TeamsScoreSection";

export default function Layout({children}) {
  const pathname = usePathname();

  return (
    <>
      {!pathname.endsWith("/trump-caller") && (
        <Box sx={{gridArea: "top", alignSelf: "end"}}>
          <TeamsScoreSection/>
        </Box>
      )}
      {children}
    </>
  );
}

