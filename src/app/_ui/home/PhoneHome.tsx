"use client";

import useLogout from "@/app/_hooks/useLogout";
import {OpenTable} from "@/app/_hooks/useOpenTable";
import useStartGame from "@/app/_hooks/useStartGame";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {color, font, shadow} from "@/app/_styles/tokens";
import {Brand} from "@/app/_ui/auth/AuthFrame";
import {buttonBase, Card, ellipsis, ErrorNote, IconCircleButton, Screen, SectionLabel, Spinner, TextButton} from "@/app/_ui/sp";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import LibraryAddRoundedIcon from "@mui/icons-material/LibraryAddRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {Box} from "@mui/material";
import {TransitionLink} from "@/app/_lib/viewTransitions";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import React from "react";

export default function PhoneHome({isAdmin, openTable}: {isAdmin: boolean; openTable: OpenTable | null}) {
  const router = useTransitionRouter();
  const {logout, loggingOut} = useLogout();
  const {start, starting, error} = useStartGame();

  return (
    <Screen>
      <Box component="header" sx={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", px: "4px", pb: "16px"}}>
        <Box component="h1" sx={{m: 0, fontWeight: "inherit"}}>
          <Brand size={44} />
        </Box>
        <IconCircleButton label="Moj profil" onClick={() => router.push("/profile")}>
          <AccountCircleRoundedIcon />
        </IconCircleButton>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={start}
        disabled={starting}
        aria-busy={starting || undefined}
        aria-describedby={error ? "start-error" : undefined}
        sx={{
          ...buttonBase,
          position: "relative",
          height: 200,
          flex: "none",
          borderRadius: "24px",
          background: color.navy,
          color: "#FFFFFF",
          p: "22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
          textAlign: "left",
          boxShadow: shadow.hero,
          // grows into the scoreboard on Start Game (the board's root has the same name)
          viewTransitionName: "table",
          transition: "transform 120ms ease",
          "&:active:not(:disabled)": {transform: "scale(.98)"},
        }}
      >
        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}>
          <Box component="span" sx={{fontSize: 15, fontWeight: 600, color: color.cream, ...ellipsis}}>
            {openTable ? `${openTable.myTeam} · ${openTable.opponent}` : "Tvoj sljedeći meč"}
          </Box>
          <Box
            component="span"
            aria-hidden
            sx={{width: 52, height: 52, flex: "none", borderRadius: "50%", background: color.cream, color: color.navy, display: "flex", alignItems: "center", justifyContent: "center"}}
          >
            {starting ? <Spinner size={22} /> : <PlayArrowRoundedIcon sx={{fontSize: 32}} />}
          </Box>
        </Box>
        <Box component="span" sx={{fontFamily: font.display, fontSize: 42, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1}}>
          Start Game
        </Box>
      </Box>
      {error && (
        <Box id="start-error">
          <ErrorNote>{error}</ErrorNote>
        </Box>
      )}

      <Box component="nav" aria-label="Poredak" sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
        <Tile href={`/league/${CURRENT_LEAGUE_ID}/daily-standings`} icon={<CalendarMonthRoundedIcon />} label="Daily Standings" />
        <Tile href={`/league/${CURRENT_LEAGUE_ID}/standings`} icon={<EmojiEventsRoundedIcon />} label="League Standings" />
      </Box>

      {openTable && (
        <Box component="section" aria-labelledby="next-table" sx={{display: "flex", flexDirection: "column", gap: "8px", mt: "6px"}}>
          <SectionLabel id="next-table" sx={{display: "flex", alignItems: "center", gap: "8px"}}>
            <Box component="span" aria-hidden sx={{width: 8, height: 8, borderRadius: "50%", background: color.red}} />
            Sljedeći stol
          </SectionLabel>
          <Card sx={{display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", overflow: "hidden"}}>
            <Box sx={{background: color.cream, color: color.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", py: "8px"}}>
              <Box component="span" sx={{fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase"}}>
                Stol
              </Box>
              <Box component="span" sx={{fontFamily: font.display, fontSize: 52, fontWeight: 800, lineHeight: 0.9}}>
                {openTable.table ?? "–"}
              </Box>
            </Box>
            <Box sx={{display: "flex", flexDirection: "column", px: "16px"}}>
              <TeamLine name={openTable.myTeam} dot={color.green} bold divider />
              <TeamLine name={openTable.opponent} dot={color.red} />
            </Box>
          </Card>
        </Box>
      )}

      {isAdmin && (
        <Box component="section" aria-labelledby="admin-controls" sx={{display: "flex", flexDirection: "column", gap: "8px", mt: "6px"}}>
          <SectionLabel id="admin-controls">Admin Controls</SectionLabel>
          <Card component="ul" sx={{listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", overflow: "hidden"}}>
            <AdminRow href="/createRound" icon={<AddCircleRoundedIcon />} label="Create Round" divider />
            <AdminRow href={`/league/${CURRENT_LEAGUE_ID}/manage`} icon={<TuneRoundedIcon />} label="Manage League" divider />
            <AdminRow href="/league/new" icon={<LibraryAddRoundedIcon />} label="Create League" divider />
            <AdminRow href="/teams" icon={<GroupAddRoundedIcon />} label="Manage Team" />
          </Card>
        </Box>
      )}

      <TextButton onClick={() => logout()} disabled={loggingOut} sx={{mt: "auto", alignSelf: "center"}}>
        <LogoutRoundedIcon />
        Log Out
      </TextButton>
    </Screen>
  );
}

function Tile({href, icon, label}: {href: string; icon: React.ReactNode; label: string}) {
  return (
    <Box
      component={TransitionLink}
      href={href}
      sx={{
        ...buttonBase,
        height: 112,
        borderRadius: "22px",
        background: color.card,
        color: color.ink,
        p: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        textDecoration: "none",
        textAlign: "left",
        boxShadow: shadow.card,
        transition: "transform 120ms ease",
        "&:active": {transform: "scale(.98)"},
        "& svg": {fontSize: 28, color: color.navy},
      }}
    >
      {icon}
      <Box component="span" sx={{fontSize: 17, fontWeight: 600, lineHeight: 1.15}}>
        {label}
      </Box>
    </Box>
  );
}

function TeamLine({name, dot, bold = false, divider = false}: {name: string; dot: string; bold?: boolean; divider?: boolean}) {
  return (
    <Box sx={{height: 56, display: "flex", alignItems: "center", gap: "10px", borderBottom: divider ? `1px solid ${color.line}` : "none"}}>
      <Box component="span" aria-hidden sx={{width: 10, height: 10, flex: "none", borderRadius: "50%", background: dot}} />
      <Box component="span" sx={{fontSize: 18, fontWeight: bold ? 700 : 600, ...ellipsis}}>
        {name}
      </Box>
    </Box>
  );
}

function AdminRow({href, icon, label, divider = false}: {href: string; icon: React.ReactNode; label: string; divider?: boolean}) {
  return (
    <Box component="li">
      <Box
        component={TransitionLink}
        href={href}
        sx={{
          ...buttonBase,
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          px: "16px",
          fontSize: 16,
          fontWeight: 500,
          color: color.ink,
          textDecoration: "none",
          textAlign: "left",
          borderBottom: divider ? `1px solid ${color.line}` : "none",
          "&:active": {background: color.pressed},
          "& > svg:first-of-type": {fontSize: 24, color: color.navy},
        }}
      >
        {icon}
        <Box component="span" sx={{flex: 1}}>
          {label}
        </Box>
        <ChevronRightRoundedIcon sx={{fontSize: 22, color: color.muted}} />
      </Box>
    </Box>
  );
}
