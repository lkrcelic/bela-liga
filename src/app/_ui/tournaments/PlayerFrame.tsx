"use client";

import useIsDesktop from "@/app/_hooks/useIsDesktop";
import {DesktopShell, Screen} from "@/app/_ui/sp";
import {Box} from "@mui/material";
import React from "react";

// The player's tournament pages are drawn for the phone (Claude Design "Natjecanja"); on the computer they keep that
// layout in a phone-wide column under the desktop's header and menu. fill: the page fills the screen (a list that
// scrolls inside a card), as Screen's fill.
export default function PlayerFrame({children, fill = false}: {children: React.ReactNode; fill?: boolean}) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) {
    return (
      <Screen gap={12} fill={fill}>
        {children}
      </Screen>
    );
  }
  return (
    <DesktopShell active="tournaments" eyebrow="Turniri">
      <Box sx={{flex: 1, minHeight: 0, overflowY: fill ? "hidden" : "auto", mx: "-36px", px: "36px"}}>
        <Box sx={{maxWidth: 480, height: fill ? "100%" : "auto", mx: "auto", display: "flex", flexDirection: "column", gap: "12px", pb: fill ? 0 : "24px"}}>{children}</Box>
      </Box>
    </DesktopShell>
  );
}
