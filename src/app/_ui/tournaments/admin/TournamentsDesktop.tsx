"use client";

import {cancelTournamentAPI, deleteTournamentAPI, setRegistrationsOpenAPI} from "@/app/_fetchers/tournament";
import {useAdminTournaments} from "@/app/_hooks/useTournaments";
import {TournamentCard} from "@/app/_interfaces/tournament";
import {nightLabel} from "@/app/_lib/nights";
import {capacityLabel} from "@/app/_lib/tournaments";
import {count, NOUN} from "@/app/_lib/ui/text";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {color, font, shadow, tint} from "@/app/_styles/tokens";
import {buttonBase, Card, DesktopShell, ellipsis, EmptyState, ErrorNote, InfoNote, LoadingRows, NARROW_DESKTOP, PrimaryButton, Spinner, SwitchTrack} from "@/app/_ui/sp";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EventListRoundedIcon from "@mui/icons-material/EventNoteRounded";
import EventUpcomingRoundedIcon from "@mui/icons-material/EventRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import {Box} from "@mui/material";
import React, {useState} from "react";
import {DateTile, FillBar, StatusChip, statusOf, tournamentMeta, ViewTabs} from "../TournamentParts";

// The admin's Turniri (Claude Design "Turniri admin" A1): the tournaments by phase, Nadolazeći · Aktivni · Završeni,
// in a table on the left; the picked one on the right with its sign-ups switch and what can be done with it.

export type ListTab = "upcoming" | "active" | "finished";

// Nadolazeći soonest first; Aktivni and Završeni (cancelled ones too) newest first
export function tournamentsOf(list: TournamentCard[], tab: ListTab): TournamentCard[] {
  const inTab = list.filter((t) => (tab === "upcoming" ? t.phase === "upcoming" : tab === "active" ? t.phase === "active" : t.phase === "finished" || t.phase === "cancelled"));
  return inTab.sort((a, b) => (tab === "upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.id - b.id);
}

const placeLine = (t: TournamentCard) => [t.location.name, t.location.address].filter(Boolean).join(", ") || "—";

export default function TournamentsDesktop() {
  const router = useTransitionRouter();
  const {tournaments, error, reload} = useAdminTournaments();
  const [tab, setTab] = useState<ListTab>("upcoming");
  const [picked, setPicked] = useState<number | null>(null);
  const list = tournamentsOf(tournaments ?? [], tab);
  const current = list.find((t) => t.id === picked) ?? list[0] ?? null;
  const counts = {
    upcoming: tournamentsOf(tournaments ?? [], "upcoming").length,
    active: tournamentsOf(tournaments ?? [], "active").length,
    finished: tournamentsOf(tournaments ?? [], "finished").length,
  };
  const grid = {flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", [NARROW_DESKTOP]: {gridTemplateColumns: "minmax(0,1fr) 330px"}, gap: "20px"} as const;
  const cols = "minmax(0,1.6fr) minmax(0,1fr) 84px 190px";

  return (
    <DesktopShell
      active="manageTournaments"
      eyebrow="Admin"
      title="Turniri"
      right={
        <PrimaryButton icon={<AddRoundedIcon />} height={52} onClick={() => router.push("/turniri/novi")} sx={{px: "22px", fontSize: 16}}>
          Novi turnir
        </PrimaryButton>
      }
    >
      <ViewTabs<ListTab>
        label="Turniri"
        value={tab}
        onChange={(k) => {
          setTab(k);
          setPicked(null);
        }}
        items={[
          {key: "upcoming", label: "Nadolazeći", icon: <EventUpcomingRoundedIcon />, count: counts.upcoming},
          {key: "active", label: "Aktivni", icon: <PlayCircleRoundedIcon />, count: counts.active},
          {key: "finished", label: "Završeni", icon: <FlagRoundedIcon />, count: counts.finished},
        ]}
      />
      <Box sx={grid}>
        <Card component="section" aria-label="Popis turnira" sx={{minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "24px"}}>
          <Box
            aria-hidden
            sx={{flex: "none", height: 40, display: "grid", gridTemplateColumns: cols, gap: "14px", alignItems: "center", px: "20px", background: color.paper2, borderBottom: `1px solid ${tint.navy[10]}`, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: color.muted}}
          >
            <span>Turnir</span>
            <span>Mjesto</span>
            <Box component="span" sx={{textAlign: "center"}}>
              Ekipe
            </Box>
            <Box component="span" sx={{textAlign: "right"}}>
              Prijave
            </Box>
          </Box>
          {error ? (
            <ErrorNote onRetry={reload} sx={{m: "14px"}}>
              {error}
            </ErrorNote>
          ) : !tournaments ? (
            <LoadingRows rows={6} height={72} />
          ) : list.length === 0 ? (
            <EmptyState>{tab === "upcoming" ? "Nema nadolazećih turnira. Napravi prvi s Novi turnir." : tab === "active" ? "Danas se ne igra nijedan turnir." : "Još nema završenih turnira."}</EmptyState>
          ) : (
            <Box component="ul" sx={{listStyle: "none", m: 0, p: 0, flex: 1, minHeight: 0, overflowY: "auto"}}>
              {list.map((t) => {
                const on = current?.id === t.id;
                return (
                  <Box component="li" key={t.id}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setPicked(t.id)}
                      aria-pressed={on}
                      sx={{
                        ...buttonBase,
                        width: "100%",
                        minHeight: 74,
                        display: "grid",
                        gridTemplateColumns: cols,
                        gap: "14px",
                        alignItems: "center",
                        px: "20px",
                        py: "8px",
                        textAlign: "left",
                        borderBottom: `1px solid ${color.divider}`,
                        background: on ? color.cream2 : "transparent",
                        boxShadow: on ? shadow.mineBar : "none",
                        "&:hover": {background: on ? color.cream2 : color.paper2},
                      }}
                    >
                      <Box sx={{display: "flex", alignItems: "center", gap: "12px", minWidth: 0}}>
                        <DateTile date={t.date} size={46} done={t.phase === "finished" || t.phase === "cancelled"} />
                        <Box sx={{minWidth: 0, display: "flex", flexDirection: "column", gap: "2px"}}>
                          <Box component="span" sx={{fontSize: 16, fontWeight: 700, color: color.ink, ...ellipsis}}>
                            {t.name}
                          </Box>
                          <Box component="span" sx={{fontSize: 13, color: color.muted, ...ellipsis}}>
                            {tournamentMeta(t)}
                          </Box>
                        </Box>
                      </Box>
                      <Box component="span" sx={{fontSize: 14, color: color.ink2, ...ellipsis}}>
                        {placeLine(t)}
                      </Box>
                      <Box component="span" sx={{textAlign: "center", fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums"}}>
                        {capacityLabel(t.teams, t.max_teams)}
                      </Box>
                      <Box sx={{display: "flex", justifyContent: "flex-end"}}>
                        <StatusChip status={statusOf(t)} sx={{alignSelf: "center"}} />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>
        <Box sx={{minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px"}}>
          {current && <PickedCard key={current.id} t={current} onChanged={reload} />}
          <InfoNote icon={<InfoRoundedIcon />}>Obriši je moguće samo prije početka turnira. Otkazan turnir ostaje u popisu s oznakom Otkazan.</InfoNote>
        </Box>
      </Box>
    </DesktopShell>
  );
}

// The right card: the picked tournament, its sign-ups and its actions
function PickedCard({t, onChanged}: {t: TournamentCard; onChanged: () => void}) {
  const router = useTransitionRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [asking, setAsking] = useState<"cancel" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const upcoming = t.phase === "upcoming";
  const manage = (view: string) => router.push(`/turniri/${t.id}/upravljanje?view=${view}`);

  const run = async (what: string, call: () => Promise<unknown>) => {
    setBusy(what);
    setError(null);
    try {
      await call();
      setAsking(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nije uspjelo.");
    }
    setBusy(null);
  };

  const tile = {
    ...buttonBase,
    height: 52,
    borderRadius: "14px",
    background: color.paper2,
    color: color.navy,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    px: "14px",
    fontSize: 15,
    fontWeight: 700,
    "&:hover": {background: color.paper},
    "& svg": {fontSize: 20},
  } as const;
  const danger = {...buttonBase, flex: 1, height: 46, borderRadius: "13px", border: `1.5px solid ${tint.red[35]}`, color: color.red, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: 15, fontWeight: 700, "& svg": {fontSize: 19}, "&:hover": {background: tint.red[6]}} as const;

  return (
    <Card component="section" aria-labelledby={`t-${t.id}`} sx={{flex: "none", borderRadius: "24px", p: "22px", display: "flex", flexDirection: "column", gap: "14px"}}>
      <Box sx={{display: "flex", flexDirection: "column", gap: "4px"}}>
        <Box component="span" sx={{fontSize: 13, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted}}>
          {[nightLabel(t.date), t.start_time].filter(Boolean).join(" · ")}
        </Box>
        <Box component="h2" id={`t-${t.id}`} sx={{m: 0, fontFamily: font.display, fontSize: 26, fontWeight: 800, lineHeight: 1.1}}>
          {t.name}
        </Box>
        <Box component="span" sx={{fontSize: 14, color: color.ink2}}>
          {[t.location.name, tournamentMeta({...t, start_time: null})].filter(Boolean).join(" · ")}
        </Box>
      </Box>
      {upcoming ? (
        <Box sx={{display: "flex", flexDirection: "column", gap: "10px", p: "14px", borderRadius: "16px", background: color.paper2}}>
          <Box
            component="button"
            type="button"
            role="switch"
            aria-checked={t.registrations_open}
            disabled={busy != null}
            onClick={() => run("open", () => setRegistrationsOpenAPI(t.id, !t.registrations_open))}
            sx={{...buttonBase, display: "flex", alignItems: "center", gap: "12px", textAlign: "left"}}
          >
            <Box sx={{flex: 1, minWidth: 0, display: "flex", flexDirection: "column"}}>
              <Box component="span" sx={{fontSize: 15, fontWeight: 700}}>
                {t.registrations_open ? "Prijave otvorene" : "Prijave zatvorene"}
              </Box>
              <Box component="span" sx={{fontSize: 13, color: color.muted}}>
                {t.max_teams != null ? `${t.teams} od ${t.max_teams} ekipa` : count(t.teams, NOUN.ekipa)}
                {t.waiting > 0 ? ` · ${t.waiting} na listi čekanja` : ""}
              </Box>
            </Box>
            {busy === "open" ? <Spinner size={20} /> : <SwitchTrack on={t.registrations_open} onColor={color.green} />}
          </Box>
          <FillBar registered={t.teams} max={t.max_teams} />
        </Box>
      ) : t.phase === "active" ? (
        <Box sx={{display: "flex", alignItems: "center", gap: "10px", p: "14px", borderRadius: "16px", background: tint.red[6], color: color.red, fontSize: 15, fontWeight: 700}}>
          <PlayCircleRoundedIcon aria-hidden />
          {t.live_kolo ? `Kolo ${t.live_kolo} uživo` : `Odigrano ${t.completed_kolos} od ${t.rounds} kola`}
        </Box>
      ) : t.winner ? (
        <Box sx={{display: "flex", flexDirection: "column", gap: "2px", p: "14px", borderRadius: "16px", background: color.cream}}>
          <Box component="span" sx={{fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.navy}}>
            Pobjednici
          </Box>
          <Box component="span" sx={{fontSize: 18, fontWeight: 800}}>
            {t.winner.team_name}
          </Box>
          <Box component="span" sx={{fontSize: 13, color: color.ink2}}>
            {t.winner.players.join(" · ")}
          </Box>
        </Box>
      ) : (
        <StatusChip status={statusOf(t)} />
      )}
      <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"}}>
        {t.phase !== "cancelled" && t.phase !== "finished" && (
          <Box component="button" type="button" onClick={() => manage("podaci")} sx={tile}>
            <EditRoundedIcon aria-hidden />
            Uredi
          </Box>
        )}
        {upcoming ? (
          <Box component="button" type="button" onClick={() => manage("prijave")} sx={tile}>
            <GroupsRoundedIcon aria-hidden />
            Prijave
          </Box>
        ) : (
          <Box component="button" type="button" onClick={() => manage(t.phase === "active" ? "kola" : "poredak")} sx={tile}>
            {t.phase === "active" ? <EventListRoundedIcon aria-hidden /> : <LeaderboardRoundedIcon aria-hidden />}
            {t.phase === "active" ? "Kola" : "Poredak"}
          </Box>
        )}
        <Box component="button" type="button" onClick={() => router.push(`/turniri/novi?kopiraj=${t.id}`)} sx={tile}>
          <ContentCopyRoundedIcon aria-hidden />
          Kopiraj
        </Box>
        <Box component="button" type="button" onClick={() => router.push(`/turniri/${t.id}`)} sx={tile}>
          <OpenInNewRoundedIcon aria-hidden />
          Stranica
        </Box>
      </Box>
      {error && <ErrorNote>{error}</ErrorNote>}
      {upcoming && asking == null && (
        <Box sx={{display: "flex", gap: "8px", pt: "6px", borderTop: `1px solid ${color.line}`}}>
          <Box component="button" type="button" onClick={() => setAsking("cancel")} sx={danger}>
            <EventBusyRoundedIcon aria-hidden />
            Otkaži
          </Box>
          <Box component="button" type="button" onClick={() => setAsking("delete")} sx={danger}>
            <DeleteRoundedIcon aria-hidden />
            Obriši
          </Box>
        </Box>
      )}
      {upcoming && asking && (
        <Confirm
          title={asking === "cancel" ? `Otkazati ${t.name}?` : `Obrisati ${t.name}?`}
          text={asking === "cancel" ? "Turnir ostaje u popisu kao Otkazan. Prijavljene ekipe neće dobiti obavijest." : "Turnir i sve prijave nestaju iz aplikacije."}
          action={asking === "cancel" ? "Otkaži turnir" : "Obriši turnir"}
          busy={busy != null}
          onCancel={() => setAsking(null)}
          onConfirm={() => run(asking, () => (asking === "cancel" ? cancelTournamentAPI(t.id) : deleteTournamentAPI(t.id)))}
        />
      )}
    </Card>
  );
}

// The desktop's inline confirmation (as Upravljanje ligom's): what happens, Odustani and the red action
export function Confirm({title, text, action, busy, onCancel, onConfirm}: {title: string; text: string; action: string; busy: boolean; onCancel: () => void; onConfirm: () => void}) {
  const small = {...buttonBase, flex: 1, height: 44, borderRadius: "12px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"} as const;
  return (
    <Box role="alert" sx={{display: "flex", flexDirection: "column", gap: "12px", p: "12px 14px", borderRadius: "16px", border: `1.5px solid ${tint.red[35]}`, background: tint.red[6]}}>
      <Box sx={{display: "flex", gap: "10px", "& > svg": {fontSize: 22, color: color.red, flex: "none"}}}>
        <WarningRoundedIcon aria-hidden />
        <Box sx={{display: "flex", flexDirection: "column", gap: "2px"}}>
          <Box component="span" sx={{fontSize: 15, fontWeight: 700}}>
            {title}
          </Box>
          <Box component="span" sx={{fontSize: 13, lineHeight: 1.45, color: color.ink2}}>
            {text}
          </Box>
        </Box>
      </Box>
      <Box sx={{display: "flex", gap: "8px"}}>
        <Box component="button" type="button" onClick={onCancel} disabled={busy} sx={{...small, border: `1.5px solid ${tint.navy[25]}`, background: color.white, color: color.navy}}>
          Odustani
        </Box>
        <Box component="button" type="button" onClick={onConfirm} disabled={busy} aria-busy={busy || undefined} sx={{...small, background: color.red, color: color.white}}>
          {busy && <Spinner size={18} tone="white" />}
          {action}
        </Box>
      </Box>
    </Box>
  );
}
