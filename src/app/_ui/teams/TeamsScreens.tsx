"use client";

import useIsDesktop from "@/app/_hooks/useIsDesktop";
import {font} from "@/app/_styles/tokens";
import {Card, DesktopShell, IconCircleButton, Muted, Screen, ScreenTitle} from "@/app/_ui/sp";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {Box} from "@mui/material";
import {useRouter} from "next/navigation";
import React from "react";
import AddTeammateForm from "./AddTeammateForm";
import CreateTeamForm from "./CreateTeamForm";

// Desktop "Teams": Create Team and Add Teammate side by side
function DesktopTeams() {
  return (
    <DesktopShell active="teams" eyebrow="Admin" title="Teams">
      <Box sx={{flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "20px", alignItems: "start"}}>
        <Card component="section" aria-labelledby="create-team" sx={{p: "26px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "24px"}}>
          <Box component="h2" id="create-team" sx={{m: 0, fontFamily: font.display, fontSize: 28, fontWeight: 800, letterSpacing: "-.01em"}}>
            Create Team
          </Box>
          <CreateTeamForm compact />
        </Card>
        <Card component="section" aria-labelledby="add-mate" sx={{p: "26px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "24px"}}>
          <Box sx={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <Box component="h2" id="add-mate" sx={{m: 0, fontFamily: font.display, fontSize: 28, fontWeight: 800, letterSpacing: "-.01em"}}>
              Add Teammate
            </Box>
            <Muted>Select team and player to add as a teammate</Muted>
          </Box>
          <AddTeammateForm compact />
        </Card>
      </Box>
    </DesktopShell>
  );
}

function PhoneFrame({title, intro, children}: {title: string; intro?: string; children: React.ReactNode}) {
  const router = useRouter();
  return (
    <Screen>
      <Box>
        <IconCircleButton label="Nazad" onClick={() => router.push("/")}>
          <ArrowBackRoundedIcon />
        </IconCircleButton>
      </Box>
      <Box sx={{display: "flex", flexDirection: "column", gap: "6px", pt: "4px", pb: intro ? 0 : "8px"}}>
        <ScreenTitle eyebrow="Admin" title={title} />
        {intro && <Muted sx={{px: "4px", fontSize: 16, lineHeight: 1.4}}>{intro}</Muted>}
      </Box>
      {children}
    </Screen>
  );
}

export function CreateTeamScreen() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DesktopTeams />;
  return (
    <PhoneFrame title="Create Team">
      <CreateTeamForm />
    </PhoneFrame>
  );
}

export function AddTeammateScreen() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DesktopTeams />;
  return (
    <PhoneFrame title="Add Teammate" intro="Select team and player to add as a teammate">
      <AddTeammateForm />
    </PhoneFrame>
  );
}

export function TeamsScreen() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DesktopTeams />;
  return (
    <PhoneFrame title="Teams">
      <Card sx={{p: "18px", display: "flex", flexDirection: "column", gap: "14px"}}>
        <Box component="h2" sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800}}>
          Create Team
        </Box>
        <CreateTeamForm compact />
      </Card>
      <Card sx={{p: "18px", display: "flex", flexDirection: "column", gap: "14px"}}>
        <Box component="h2" sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800}}>
          Add Teammate
        </Box>
        <AddTeammateForm compact />
      </Card>
    </PhoneFrame>
  );
}
