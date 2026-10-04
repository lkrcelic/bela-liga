"use client";

import {getPlayerByIdAPI} from "@/app/_fetchers/player/getById";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useMyTeams from "@/app/_hooks/useMyTeams";
import {PlayerResponse} from "@/app/_interfaces/player";
import useAuthStore from "@/app/_store/authStore";
import {color, font} from "@/app/_styles/tokens";
import {
  Card,
  CenteredSpinner,
  DesktopShell,
  ellipsis,
  EmptyState,
  ErrorNote,
  InitialsAvatar,
  PlayerChip,
  PrimaryButton,
  Screen,
  ScrollArea,
  SectionLabel,
  tabular,
} from "@/app/_ui/sp";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import {Box, Skeleton} from "@mui/material";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useCallback, useEffect, useState} from "react";

export default function ProfilePage() {
  const router = useTransitionRouter();
  const isDesktop = useIsDesktop();
  const user = useAuthStore((s) => s.user);
  const {teams, loading: teamsLoading} = useMyTeams();
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setError(null);
    getPlayerByIdAPI(user.id)
      .then(setPlayer)
      .catch(() => setError("Profil nije moguće učitati."));
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const fullName = player ? `${player.first_name} ${player.last_name}`.trim() : "";
  const details = [
    {k: "Username", v: player?.username},
    {k: "Email", v: player?.email},
    {k: "First name", v: player?.first_name},
    {k: "Last name", v: player?.last_name},
    {k: "Rating", v: player?.rating != null ? String(player.rating) : undefined},
  ];

  const hero = (desktop: boolean) => (
    <Card
      component="section"
      aria-label="Igrač"
      sx={{
        background: color.cream,
        boxShadow: "none",
        borderRadius: desktop ? "28px" : "24px",
        p: desktop ? "28px" : "20px",
        display: "flex",
        flexDirection: "column",
        gap: desktop ? "22px" : "18px",
        flex: "none",
      }}
    >
      <Box sx={{display: "flex", flexDirection: desktop ? "column" : "row", alignItems: desktop ? "flex-start" : "center", gap: desktop ? "22px" : "14px"}}>
        <InitialsAvatar name={fullName || user?.username || ""} size={desktop ? 96 : 64} variant="navy" />
        <Box sx={{display: "flex", flexDirection: "column", gap: desktop ? "4px" : "2px", minWidth: 0}}>
          <Box component="h1" sx={{m: 0, fontFamily: font.display, fontSize: desktop ? 34 : 28, fontWeight: 800, lineHeight: 1, letterSpacing: "-.02em", ...ellipsis}}>
            {player?.username ?? user?.username ?? <Skeleton width={160} />}
          </Box>
          <Box sx={{fontSize: desktop ? 17 : 16, color: color.inkSoft}}>{player ? fullName : <Skeleton width={120} />}</Box>
        </Box>
      </Box>
      <Box sx={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: `1px solid ${color.border}`, pt: desktop ? "16px" : "14px"}}>
        <Box sx={{fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: color.inkSoft}}>Rating</Box>
        <Box sx={{fontFamily: font.display, fontSize: desktop ? 56 : 44, fontWeight: 800, lineHeight: 0.85, color: color.navy, ...tabular}}>
          {player?.rating ?? "—"}
        </Box>
      </Box>
    </Card>
  );

  const detailsBlock = (desktop: boolean) => (
    <Box component="section" aria-labelledby="details" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
      <SectionLabel id="details">Details</SectionLabel>
      <Card component="dl" sx={{m: 0, overflow: "hidden"}}>
        {details.map((d) => (
          <Box
            key={d.k}
            sx={{height: desktop ? 56 : 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", px: desktop ? "18px" : "16px", borderBottom: `1px solid ${color.line}`}}
          >
            <Box component="dt" sx={{flex: "none", whiteSpace: "nowrap", fontSize: 15, color: color.muted}}>
              {d.k}
            </Box>
            <Box component="dd" sx={{m: 0, minWidth: 0, textAlign: "right", fontSize: 15, fontWeight: 600, ...ellipsis}}>
              {player ? d.v || "—" : <Skeleton width={110} />}
            </Box>
          </Box>
        ))}
      </Card>
    </Box>
  );

  const teamsBlock = (desktop: boolean) => (
    <Box component="section" aria-labelledby="my-teams" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
      <SectionLabel id="my-teams">My Teams</SectionLabel>
      {teamsLoading ? (
        <Card>
          <CenteredSpinner />
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <EmptyState>Još nisi član nijedne ekipe.</EmptyState>
        </Card>
      ) : (
        teams.map((t) => (
          <Card key={t.team_id} sx={{p: desktop ? "18px" : "16px", display: "flex", flexDirection: "column", gap: desktop ? "12px" : "10px"}}>
            <Box component="h3" sx={{m: 0, fontFamily: font.display, fontSize: desktop ? 24 : 22, fontWeight: 700, letterSpacing: "-.01em"}}>
              {t.team_name}
            </Box>
            <Box component="ul" aria-label="Igrači" sx={{listStyle: "none", m: 0, p: 0, display: "flex", flexWrap: "wrap", gap: "8px"}}>
              {t.teamPlayers?.map((tp) => (
                <Box component="li" key={tp.player.id}>
                  <PlayerChip name={tp.player.username} />
                </Box>
              ))}
            </Box>
          </Card>
        ))
      )}
    </Box>
  );

  const errorNote = error && <ErrorNote onRetry={load}>{error}</ErrorNote>;

  if (isDesktop) {
    return (
      <DesktopShell active="profile" eyebrow="My Profile" title="Profil">
        {errorNote}
        <Box sx={{flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "360px minmax(0,1fr)", gap: "20px", alignItems: "start"}}>
          {hero(true)}
          <Box sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "20px", alignItems: "start"}}>
            {detailsBlock(true)}
            {teamsBlock(true)}
          </Box>
        </Box>
      </DesktopShell>
    );
  }

  return (
    <Screen fill>
      {hero(false)}
      {errorNote}
      <ScrollArea bleed>
        {detailsBlock(false)}
        {teamsBlock(false)}
      </ScrollArea>
      <PrimaryButton icon={<HomeRoundedIcon />} onClick={() => router.push("/", "back")}>
        Početni zaslon
      </PrimaryButton>
    </Screen>
  );
}
