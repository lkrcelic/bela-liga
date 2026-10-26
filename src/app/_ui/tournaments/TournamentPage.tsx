"use client";

import {signOffAPI} from "@/app/_fetchers/tournament";
import useNavStack from "@/app/_hooks/useNavStack";
import useOpenTable from "@/app/_hooks/useOpenTable";
import useStartGame from "@/app/_hooks/useStartGame";
import {useTournament, useTournaments} from "@/app/_hooks/useTournaments";
import {leagueDateString} from "@/app/_lib/dates";
import useAuthStore from "@/app/_store/authStore";
import {color, font, shadow} from "@/app/_styles/tokens";
import {StartCard} from "@/app/_ui/home/PhoneHome";
import {buttonBase, Card, ConfirmSheet, EmptyState, ErrorNote, LoadingRows, StackTopBar} from "@/app/_ui/sp";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {Box} from "@mui/material";
import {useSearchParams} from "next/navigation";
import React, {useEffect, useState} from "react";
import PlayerFrame from "./PlayerFrame";
import {EntriesPreview, InfoCard, MyMatchesCard, MyResultCard, PrizesCard, ResultsButton, SignUpCard, TournamentHead, UpcomingCard, WinnersCard} from "./PlayerParts";
import SignUpSheet from "./SignUpSheet";

// A tournament's page (Claude Design "Natjecanja" R1–R5, D1–D2, W1, G0). Before it starts: the navy card of the
// sign-ups (Prijavi se, or the team signed up or waiting), the details, the prizes and the teams signed up. On the
// day: the player's table (Nastavi igru / Započni igru) and Poredak i rezultati. Once it is over: Pobjednici, the
// results, and for a player who played Vaš rezultat and Vaši mečevi. Public: a visitor sees it read-only.
// ?prijava=1 (Prijavi se on Početna) opens the sign-up sheet at once.
export default function TournamentPage({id}: {id: number}) {
  const meId = useAuthStore((s) => s.user?.id ?? null);
  const signedIn = meId != null;
  const [every, setEvery] = useState<number | undefined>(undefined);
  const {tournament: t, error, notFound, reload} = useTournament(id, every);
  const nav = useNavStack(t ? t.name : null, "/turniri");
  const params = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const [withdraw, setWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const {table: openTable} = useOpenTable("tournament");
  const game = useStartGame({scope: "tournament"});
  const {tournaments} = useTournaments();
  const today = leagueDateString();

  // a tournament being played comes in again every 30 s
  const live = t?.phase === "active";
  if ((live ? 30_000 : undefined) !== every) setEvery(live ? 30_000 : undefined);
  useEffect(() => {
    if (t && params.get("prijava") === "1" && signedIn && t.phase === "upcoming" && t.registrations_open && !t.me) setSheet(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.id]);

  const signOff = async () => {
    if (!t?.me) return;
    setBusy(true);
    setWithdrawError(null);
    try {
      await signOffAPI(t.id, t.me.team_id);
      setWithdraw(false);
      reload();
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : "Ekipa nije odjavljena.");
    }
    setBusy(false);
  };

  const others = (tournaments ?? []).filter((x) => x.phase === "upcoming" && x.id !== id).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const myTable = openTable && openTable.tournamentId === id ? openTable : null;

  return (
    <PlayerFrame>
      <StackTopBar eyebrow="Turnir" nav={nav} />
      {notFound ? (
        <Card>
          <EmptyState>Ovaj turnir ne postoji.</EmptyState>
        </Card>
      ) : error && !t ? (
        <ErrorNote onRetry={reload}>{error}</ErrorNote>
      ) : !t ? (
        <Card>
          <LoadingRows rows={6} height={56} />
        </Card>
      ) : (
        <>
          <TournamentHead t={t} today={today} />
          {t.phase === "upcoming" && (
            <>
              <SignUpCard t={t} meId={meId} signedIn={signedIn} onSignUp={() => setSheet(true)} />
              <InfoCard t={t} hidePlace={t.me?.status === "REGISTERED"} />
              <PrizesCard prizes={t.prizes} startsOpen={t.me != null} />
              <EntriesPreview t={t} meId={meId} />
              {t.me && (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setWithdraw(true)}
                  sx={{...buttonBase, alignSelf: "center", height: 48, display: "flex", alignItems: "center", gap: "8px", px: "16px", borderRadius: "14px", color: color.red, fontSize: 15, fontWeight: 700, "& svg": {fontSize: 20}}}
                >
                  <LogoutRoundedIcon aria-hidden />
                  {t.me.status === "WAITING" ? "Makni se s liste čekanja" : "Odjavi se s turnira"}
                </Box>
              )}
            </>
          )}
          {t.phase === "active" && (
            <>
              {myTable ? (
                <StartCard table={myTable} starting={game.starting} onStart={game.start} />
              ) : (
                t.me?.status === "REGISTERED" && <WaitingCard team={t.me.team_name} kolo={t.live_kolo} />
              )}
              {game.error && <ErrorNote>{game.error}</ErrorNote>}
              <ResultsButton t={t} />
            </>
          )}
          {t.phase === "finished" && (
            <>
              {t.winner && <WinnersCard winner={t.winner} />}
              <ResultsButton t={t} />
              {t.my_result && <MyResultCard r={t.my_result} />}
              <MyMatchesCard matches={t.my_matches} tournamentId={t.id} />
            </>
          )}
          {t.phase === "cancelled" && (
            <>
              <Card sx={{p: "16px 18px", fontSize: 15, lineHeight: 1.5}}>Turnir je otkazan. Prijave su zatvorene i turnir se neće igrati.</Card>
              <InfoCard t={t} />
            </>
          )}
          {t.phase !== "upcoming" && others.length > 0 && (
            <Box component="section" aria-label="Nadolazeći turniri" sx={{display: "flex", flexDirection: "column", gap: "8px", pt: "6px"}}>
              <Box component="h2" sx={{m: 0, px: "4px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted}}>
                Nadolazeći turniri
              </Box>
              <Box component="ul" sx={{listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: "10px"}}>
                {others.map((o) => (
                  <UpcomingCard key={o.id} t={o} />
                ))}
              </Box>
            </Box>
          )}
          {signedIn && t.phase === "upcoming" && (
            <SignUpSheet
              t={t}
              open={sheet}
              onClose={() => setSheet(false)}
              onDone={() => {
                setSheet(false);
                reload();
              }}
            />
          )}
          {t.me && (
            <ConfirmSheet
              open={withdraw}
              onClose={() => setWithdraw(false)}
              onConfirm={signOff}
              title={t.me.status === "WAITING" ? `Maknuti ekipu ${t.me.team_name} s liste čekanja?` : `Odjaviti ekipu ${t.me.team_name} s turnira?`}
              text="Ekipa više neće biti na popisu prijavljenih. Možeš se ponovo prijaviti dok su prijave otvorene."
              action="Odjavi ekipu"
              icon={<LogoutRoundedIcon />}
              busy={busy}
              error={withdrawError}
            />
          )}
        </>
      )}
    </PlayerFrame>
  );
}

// On the day, between the player's tables: their team and the Kolo being played
function WaitingCard({team, kolo}: {team: string; kolo: number | null}) {
  return (
    <Box component="section" aria-label="Tvoja ekipa" sx={{flex: "none", borderRadius: "24px", background: color.navy, color: color.white, p: "18px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: shadow.hero}}>
      <Box component="h2" sx={{m: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.cream}}>
        Tvoja ekipa
      </Box>
      <Box sx={{fontFamily: font.display, fontSize: 30, fontWeight: 800, lineHeight: 1, overflowWrap: "anywhere"}}>{team}</Box>
      <Box sx={{fontSize: 15, lineHeight: 1.45, color: color.cream}}>
        {kolo ? `Vaš stol u Kolu ${kolo} je odigran. Sljedeće kolo kreće kad svi stolovi završe.` : "Sljedeće kolo uskoro: stol će se pojaviti ovdje."}
      </Box>
    </Box>
  );
}
