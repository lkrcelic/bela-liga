"use client";

import useBurza from "@/app/_hooks/useBurza";
import useLeagues, {useSelectedLeagueId} from "@/app/_hooks/useLeagues";
import {getLeagueNightsAPI} from "@/app/_fetchers/league/nights";
import {LeagueNightRow} from "@/app/_interfaces/league";
import {leagueDateString} from "@/app/_lib/dates";
import {currentLeagueHref} from "@/app/_lib/league";
import {nightTimeLabel, seasonGlance} from "@/app/_lib/nights";
import {authHref} from "@/app/_lib/publicPaths";
import {TransitionLink} from "@/app/_lib/viewTransitions";
import useGuestSheet from "@/app/_store/guestSheetStore";
import {color, font, shadow, tint} from "@/app/_styles/tokens";
import {Brand} from "@/app/_ui/auth/AuthFrame";
import {BurzaHomeCard} from "@/app/_ui/home/HomeCards";
import {HomeTab, readHomeTab, saveHomeTab} from "@/app/_ui/home/PhoneHome";
import InstallSheet from "@/app/_ui/install/InstallSheet";
import {buttonBase, Segmented, tabPanelProps} from "@/app/_ui/sp";
import PlayerFrame from "@/app/_ui/tournaments/PlayerFrame";
import TournamentsOverview from "@/app/_ui/tournaments/TournamentsOverview";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import {Box} from "@mui/material";
import React, {useEffect, useState} from "react";

// Početna for someone without an account ("Gost i poziv" G1, G2): Prijava instead of the rating and the profile, the
// switch Turniri · Liga (Turniri first, the pick remembered as a player's), the tournaments and Burza igrača as they
// are, and the league locked: its next night with "Ligu prate i igraju samo igrači s računom" and Napravi račun, and
// the tiles shown dimmed with a lock, opening "Sjedni za stol." On the computer, the same in the phone-wide column.
export default function GuestHome() {
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<HomeTab>(() => readHomeTab() ?? "turniri");
  const pick = (t: HomeTab) => {
    setTab(t);
    saveHomeTab(t);
  };

  return (
    <PlayerFrame active="home" eyebrow="Početna">
      {!isDesktop && (
        <Box component="header" sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", px: "4px", pb: "4px"}}>
          <Box component="h1" sx={{m: 0, fontWeight: "inherit", minWidth: 0}}>
            <Brand variant="home" />
          </Box>
          <Box
            component={TransitionLink}
            href="/login"
            sx={{...buttonBase, flex: "none", height: 40, display: "flex", alignItems: "center", gap: "6px", p: "0 16px 0 12px", borderRadius: "20px", background: color.navy, color: color.white, fontSize: 14.5, fontWeight: 700, textDecoration: "none", "& svg": {fontSize: 20}}}
          >
            <LoginRoundedIcon aria-hidden />
            Prijava
          </Box>
        </Box>
      )}

      <Segmented<HomeTab>
        items={[
          {key: "turniri", label: <><MilitaryTechRoundedIcon aria-hidden sx={{fontSize: 20}} />Turniri</>},
          {key: "liga", label: <><LockRoundedIcon aria-label="zaključano" sx={{fontSize: 18}} />Liga</>},
        ]}
        value={tab}
        onChange={pick}
        label="Početna"
        variant="track"
        size={48}
        idPrefix="home"
      />

      <Box {...tabPanelProps("home", tab)} sx={{display: "flex", flexDirection: "column", gap: "12px"}}>
        {tab === "liga" ? <GuestLeague /> : <TournamentsOverview withBurza />}
      </Box>

      {!isDesktop && <InstallSheet />}
    </PlayerFrame>
  );
}

// G2: the league's name and night, the next night locked, Burza igrača (public) and the league's pages locked
function GuestLeague() {
  const leagueId = useSelectedLeagueId();
  const leagues = useLeagues();
  const name = leagues.find((l) => l.id === leagueId)?.name ?? null;
  const [nights, setNights] = useState<LeagueNightRow[] | null>(null);
  const {posts} = useBurza();
  useEffect(() => {
    if (leagueId == null) return;
    let cancelled = false;
    getLeagueNightsAPI(leagueId)
      .then((n) => !cancelled && setNights(n))
      .catch(() => !cancelled && setNights([]));
    return () => {
      cancelled = true;
    };
  }, [leagueId]);
  const glance = nights ? seasonGlance(nights, leagueDateString()) : null;

  return (
    <>
      {name && (
        <Box sx={{px: "4px", display: "flex", flexDirection: "column", gap: "2px"}}>
          <Box component="h2" sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800, lineHeight: 1.1}}>
            {name}
          </Box>
          {glance && (
            <Box component="span" sx={{fontSize: 14, color: color.muted}}>
              {glance.label}
            </Box>
          )}
        </Box>
      )}
      <Box component="section" aria-label="Sljedeća večer" sx={{flex: "none", borderRadius: "24px", background: color.navy, color: color.white, p: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: shadow.hero}}>
        <Box component="span" sx={{fontSize: 12.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.cream}}>
          Sljedeća večer
        </Box>
        {glance?.next && (
          <Box component="span" sx={{fontFamily: font.display, fontSize: 26, fontWeight: 800, lineHeight: 1.05}}>
            {nightTimeLabel(glance.next.date, glance.next.time)}
          </Box>
        )}
        <Box sx={{mt: "4px", display: "flex", alignItems: "center", gap: "12px", p: "12px 14px", borderRadius: "16px", background: tint.creamOnNavy[16], "& svg": {fontSize: 24, color: color.cream, flex: "none"}}}>
          <LockRoundedIcon aria-hidden />
          <Box component="span" sx={{flex: 1, fontSize: 14.5, lineHeight: 1.4}}>
            Ligu prate i igraju samo igrači s računom.
          </Box>
        </Box>
        <Box
          component={TransitionLink}
          href={authHref("/signup", "/")}
          sx={{...buttonBase, height: 52, borderRadius: "16px", background: color.white, color: color.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, textDecoration: "none"}}
        >
          Napravi račun
        </Box>
      </Box>

      <BurzaHomeCard posts={posts} />

      <Box component="nav" aria-label="Izbornik" sx={{display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px"}}>
        <LockedTile href="/raspored" icon={<EventRoundedIcon />} label="Raspored" />
        <LockedTile href={currentLeagueHref("daily-standings", leagueId)} icon={<CalendarMonthRoundedIcon />} label="Dnevni poredak" />
        <LockedTile href={currentLeagueHref("standings", leagueId)} icon={<EmojiEventsRoundedIcon />} label="Ukupni poredak" />
        <LockedTile href="/ratings" icon={<LeaderboardRoundedIcon />} label="Rejting" />
      </Box>
    </>
  );
}

// Početna's tile (HomeTile) for a page only players see: dimmed, with a lock, opening "Sjedni za stol." that comes back
// to the page after logging in
function LockedTile({href, icon, label}: {href: string; icon: React.ReactNode; label: string}) {
  const show = useGuestSheet((s) => s.show);
  return (
    <Box
      component="button"
      type="button"
      onClick={() => show(href)}
      aria-label={`${label} (samo s računom)`}
      sx={{
        ...buttonBase,
        position: "relative",
        height: 64,
        boxSizing: "border-box",
        borderRadius: "18px",
        background: color.white,
        color: color.ink,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        px: "14px",
        fontSize: 15,
        fontWeight: 600,
        lineHeight: 1.2,
        textAlign: "left",
        opacity: 0.55,
        boxShadow: shadow.card,
        "& > svg:first-of-type": {fontSize: 24, color: color.navy, flex: "none"},
      }}
    >
      {icon}
      <Box component="span" sx={{flex: 1, minWidth: 0}}>
        {label}
      </Box>
      <LockRoundedIcon aria-hidden sx={{fontSize: 17, color: color.muted, flex: "none"}} />
    </Box>
  );
}
