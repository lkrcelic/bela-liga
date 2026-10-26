"use client";

import {searchTeammatesAPI, signUpAPI, TeammateHit} from "@/app/_fetchers/tournament";
import {MyTeamOption, TournamentDetail} from "@/app/_interfaces/tournament";
import {nightLabel} from "@/app/_lib/nights";
import {teamInitial} from "@/app/_lib/ui/profiles";
import {color, font, shadow, tint} from "@/app/_styles/tokens";
import {BottomSheet, buttonBase, ellipsis, ErrorNote, InitialsAvatar, PrimaryButton, SearchInput, Spinner, TextField} from "@/app/_ui/sp";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import {Box} from "@mui/material";
import React, {useEffect, useState} from "react";

// Prijava ekipe (Claude Design "Natjecanja" F1–F4): the player picks one of their teams (each with all its players: who
// of them plays is picked on Tko igra before every Kolo), or makes a new team with a teammate who has an account and
// signs it up in the same step. A teammate without an account gets an invitation link instead. The search finds
// players by name only (usernames are private, DECISIONS #40).

type Props = {t: TournamentDetail; open: boolean; onClose: () => void; onDone: (status: "REGISTERED" | "WAITING") => void};

export default function SignUpSheet({t, open, onClose, onDone}: Props) {
  const [view, setView] = useState<"pick" | "new">("pick");
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligible = t.my_teams.filter((m) => !m.entry && !m.reason);
  useEffect(() => {
    if (!open) return;
    setView(t.my_teams.length === 0 ? "new" : "pick");
    setPicked(eligible.length === 1 ? eligible[0].team_id : null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (body: Parameters<typeof signUpAPI>[1]) => {
    setBusy(true);
    setError(null);
    try {
      const r = await signUpAPI(t.id, body);
      onDone(r.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ekipa nije prijavljena.");
    }
    setBusy(false);
  };
  const eyebrow = `${t.name} · ${nightLabel(t.date)}`;
  const team = t.my_teams.find((m) => m.team_id === picked);

  if (view === "new") {
    return (
      <BottomSheet open={open} onClose={onClose} title="Nova ekipa" eyebrow={eyebrow} closable tall busy={busy}>
        {t.my_teams.length > 0 && (
          <Box component="button" type="button" onClick={() => setView("pick")} sx={{...buttonBase, alignSelf: "flex-start", height: 36, display: "flex", alignItems: "center", gap: "2px", pr: "10px", borderRadius: "10px", color: color.navy, fontSize: 14, fontWeight: 700, "& svg": {fontSize: 22}}}>
            <ChevronLeftRoundedIcon aria-hidden />
            Moje ekipe
          </Box>
        )}
        <NewTeamForm
          me={t.my_teams.flatMap((m) => m.players).find((p) => p.me) ?? null}
          full={t.max_teams != null && t.teams >= t.max_teams}
          busy={busy}
          error={error}
          onSubmit={(name, partnerId) => submit({new_team: {name, partner_id: partnerId}})}
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Koju ekipu prijavljuješ?" eyebrow={eyebrow} closable tall busy={busy}>
      <Box component="ul" aria-label="Moje ekipe" sx={{flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", listStyle: "none", m: 0, p: "2px", display: "flex", flexDirection: "column", gap: "10px", "& > li": {flex: "none"}}}>
        {t.my_teams.map((m) => (
          <TeamOption key={m.team_id} m={m} on={m.team_id === picked} onPick={() => setPicked(m.team_id)} />
        ))}
        <Box component="li">
          <Box
            component="button"
            type="button"
            onClick={() => setView("new")}
            sx={{...buttonBase, width: "100%", height: 56, borderRadius: "18px", border: `1.5px dashed ${tint.navy[35]}`, color: color.navy, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: 16, fontWeight: 700, "& svg": {fontSize: 22}}}
          >
            <AddRoundedIcon aria-hidden />
            Nova ekipa
          </Box>
        </Box>
        <Box component="li" sx={{fontSize: 13, color: color.muted, textAlign: "center", pb: "4px"}}>
          Prikazane su samo ekipe u kojima igraš.
        </Box>
      </Box>
      {error && <ErrorNote>{error}</ErrorNote>}
      <PrimaryButton icon={<HowToRegRoundedIcon />} disabled={!team || !!team.reason || !!team.entry} loading={busy} onClick={() => team && submit({team_id: team.team_id})} sx={{flex: "none"}}>
        {team ? `Prijavi ekipu ${team.team_name}` : "Odaberi ekipu"}
      </PrimaryButton>
    </BottomSheet>
  );
}

// One of the player's teams: its letter and name, a radio, and every player of it; one that can't sign up says why
function TeamOption({m, on, onPick}: {m: MyTeamOption; on: boolean; onPick: () => void}) {
  const off = !!m.reason || !!m.entry;
  const why = m.entry === "REGISTERED" ? "Već je prijavljena." : m.entry === "WAITING" ? "Već je na listi čekanja." : m.reason;
  return (
    <Box component="li">
      <Box
        component="button"
        type="button"
        role="radio"
        aria-checked={on}
        aria-disabled={off || undefined}
        onClick={off ? undefined : onPick}
        sx={{
          ...buttonBase,
          width: "100%",
          p: "14px",
          borderRadius: "18px",
          background: on ? color.cream2 : color.white,
          border: `1.5px solid ${on ? color.navy : color.line}`,
          boxShadow: on ? shadow.card : "none",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          textAlign: "left",
          opacity: off ? 0.6 : 1,
          cursor: off ? "not-allowed" : "pointer",
        }}
      >
        <Box sx={{display: "flex", alignItems: "center", gap: "12px", width: "100%"}}>
          <InitialsAvatar name={m.team_name} letters={teamInitial(m.team_name)} src={m.photo_url} size={40} variant={on ? "navy" : "paper"} />
          <Box component="span" sx={{flex: 1, minWidth: 0, fontSize: 17, fontWeight: 800, ...ellipsis}}>
            {m.team_name}
          </Box>
          {!off && (on ? <RadioButtonCheckedRoundedIcon sx={{color: color.navy}} /> : <RadioButtonUncheckedRoundedIcon sx={{color: color.faint}} />)}
        </Box>
        <Box sx={{width: "100%", display: "flex", flexDirection: "column", gap: "6px", pl: "2px"}}>
          <Box component="span" sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted}}>
            Igrači
          </Box>
          {m.players.map((p) => (
            <Box key={p.id} sx={{display: "flex", alignItems: "center", gap: "8px", fontSize: 15, minWidth: 0}}>
              <InitialsAvatar name={p.name} src={p.photo_url} size={28} sx={{fontSize: 10}} />
              <Box component="span" sx={ellipsis}>
                {p.name}
              </Box>
              {p.me && (
                <Box component="span" sx={{flex: "none", color: color.muted}}>
                  (ti)
                </Box>
              )}
            </Box>
          ))}
        </Box>
        {why && (
          <Box component="span" sx={{fontSize: 13, fontWeight: 600, color: m.reason ? color.red : color.muted}}>
            {why}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Pošalji poziv: the app's sign-up link, shared (or copied where the phone can't share)
async function shareInvite(name: string): Promise<"shared" | "copied" | "failed"> {
  const url = `${window.location.origin}/signup`;
  const text = `${name ? `${name}, ` : ""}napravi račun u Belatronici pa se zajedno prijavimo na turnir: ${url}`;
  try {
    if (navigator.share) {
      await navigator.share({title: "Belatronika", text, url});
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch (e) {
    return e instanceof Error && e.name === "AbortError" ? "shared" : "failed";
  }
}

// F2–F4: the player (fixed), the teammate picked by searching for a name, the team's name, Kreiraj ekipu i prijavi
function NewTeamForm({
  me,
  full,
  busy,
  error,
  onSubmit,
}: {
  me: {name: string; photo_url: string | null} | null;
  full: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (name: string, partnerId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<TeammateHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState<TeammateHit | null>(null);
  const [name, setName] = useState("");
  const [invite, setInvite] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (partner || q.length < 2) {
      setHits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      searchTeammatesAPI(q)
        .then((h) => !cancelled && setHits(h))
        .catch(() => !cancelled && setHits([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, partner]);

  const missing = hits != null && hits.length === 0 && query.trim().length >= 3 && !loading;
  const ready = partner != null && name.trim().length > 0;
  const hint = !partner ? (missing ? "Oba igrača moraju imati račun." : "Prvo odaberi suigrača.") : !name.trim() ? "Upiši ime ekipe." : null;
  const slot = {display: "flex", alignItems: "center", gap: "12px", minHeight: 56, px: "14px"} as const;

  return (
    <>
      {/* the column scrolls; its parts keep their height (a long list of hits would squeeze the players' box) */}
      <Box sx={{flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", display: "flex", flexDirection: "column", gap: "14px", p: "2px", "& > *": {flex: "none"}}}>
        <Box sx={{display: "flex", gap: "10px", p: "12px 14px", borderRadius: "16px", background: tint.gold[16], fontSize: 14, lineHeight: 1.45, "& svg": {flex: "none", fontSize: 20, color: color.medal[0]}}}>
          <InfoRoundedIcon aria-hidden />
          Oba igrača moraju imati račun u Belatronici. Bez toga ekipa se ne može napraviti ni prijaviti.
        </Box>
        <Box component="span" sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted, mb: "-6px"}}>
          Igrači
        </Box>
        <Box sx={{borderRadius: "16px", background: color.white, border: `1px solid ${color.line}`, overflow: "hidden"}}>
          <Box sx={{...slot, borderBottom: `1px solid ${color.line}`}}>
            <Box component="span" sx={{width: 18, fontFamily: font.display, fontWeight: 800, color: color.muted}}>
              1
            </Box>
            {me && <InitialsAvatar name={me.name} src={me.photo_url} size={34} sx={{fontSize: 12}} />}
            <Box component="span" sx={{fontSize: 16, fontWeight: 600, ...ellipsis}}>
              {me ? me.name : "Ti"}
            </Box>
            {me && (
              <Box component="span" sx={{flex: "none", color: color.muted}}>
                (ti)
              </Box>
            )}
          </Box>
          {partner ? (
            <Box sx={slot}>
              <Box component="span" sx={{width: 18, fontFamily: font.display, fontWeight: 800, color: color.muted}}>
                2
              </Box>
              <InitialsAvatar name={partner.name} src={partner.photo_url} size={34} sx={{fontSize: 12}} />
              <Box component="span" sx={{flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, ...ellipsis}}>
                {partner.name}
              </Box>
              <Box component="button" type="button" aria-label={`Makni ${partner.name}`} onClick={() => setPartner(null)} sx={{...buttonBase, width: 40, height: 40, borderRadius: "50%", color: color.muted, display: "flex", alignItems: "center", justifyContent: "center", "&:hover": {background: color.paper}}}>
                <CloseRoundedIcon />
              </Box>
            </Box>
          ) : (
            <Box sx={{display: "flex", alignItems: "center", gap: "10px", p: "8px 10px 8px 14px"}}>
              <Box component="span" sx={{width: 18, fontFamily: font.display, fontWeight: 800, color: color.muted}}>
                2
              </Box>
              <SearchInput variant="paper" height={46} placeholder="Ime i prezime suigrača" aria-label="Traži suigrača" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} sx={{flex: 1}} />
            </Box>
          )}
        </Box>
        {!partner && hits != null && hits.length > 0 && (
          <Box component="ul" aria-label="Igrači u aplikaciji" sx={{listStyle: "none", m: 0, p: 0, borderRadius: "16px", background: color.white, border: `1px solid ${color.line}`, overflow: "hidden"}}>
            {hits.map((h, i) => (
              <Box component="li" key={h.id} sx={{...slot, borderTop: i ? `1px solid ${color.line}` : "none"}}>
                <InitialsAvatar name={h.name} src={h.photo_url} size={34} sx={{fontSize: 12}} />
                <Box component="span" sx={{flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, ...ellipsis}}>
                  {h.name}
                </Box>
                <Box component="button" type="button" onClick={() => setPartner(h)} sx={{...buttonBase, height: 40, px: "14px", borderRadius: "12px", background: color.navy, color: color.white, fontSize: 14, fontWeight: 700}}>
                  Odaberi
                </Box>
              </Box>
            ))}
          </Box>
        )}
        {!partner && loading && (
          <Box sx={{display: "flex", alignItems: "center", gap: "10px", fontSize: 14, color: color.muted, px: "4px"}}>
            <Spinner size={18} /> Tražim…
          </Box>
        )}
        {!partner && missing && (
          <Box role="status" sx={{display: "flex", flexDirection: "column", gap: "10px", p: "14px", borderRadius: "16px", background: color.paper, border: `1px solid ${color.line}`}}>
            <Box sx={{display: "flex", alignItems: "flex-start", gap: "10px", "& svg": {flex: "none", fontSize: 24, color: color.navy}}}>
              <PersonOffRoundedIcon aria-hidden />
              <Box sx={{display: "flex", flexDirection: "column", gap: "4px"}}>
                <Box component="span" sx={{fontSize: 15, fontWeight: 700}}>
                  „{query.trim()}” nema račun u aplikaciji
                </Box>
                <Box component="span" sx={{fontSize: 14, lineHeight: 1.45, color: color.ink2}}>
                  Ekipu možeš napraviti i prijaviti tek kad se suigrač registrira. Pošalji mu poveznicu, a kad napravi račun, potraži ga ponovo.
                </Box>
              </Box>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={async () => {
                const r = await shareInvite(query.trim().split(/\s+/)[0] ?? "");
                setInvite(r === "copied" ? "Poveznica je kopirana." : r === "failed" ? "Poveznica se nije mogla podijeliti." : null);
              }}
              sx={{...buttonBase, alignSelf: "flex-start", height: 44, display: "flex", alignItems: "center", gap: "8px", px: "16px", borderRadius: "14px", background: color.navy, color: color.white, fontSize: 15, fontWeight: 700, "& svg": {fontSize: 20}}}
            >
              <ShareRoundedIcon aria-hidden />
              Pošalji poziv
            </Box>
            {invite && (
              <Box component="span" sx={{fontSize: 13, color: color.ink2}}>
                {invite}
              </Box>
            )}
          </Box>
        )}
        {partner && <TextField label="Ime ekipe" placeholder="npr. Kvartovski" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />}
        {full && <Box sx={{fontSize: 13, color: color.ink2}}>Turnir je pun: nova ekipa ide na listu čekanja.</Box>}
      </Box>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Box sx={{flex: "none", display: "flex", flexDirection: "column", gap: "6px"}}>
        <PrimaryButton icon={<HowToRegRoundedIcon />} disabled={!ready} loading={busy} onClick={() => partner && onSubmit(name.trim(), partner.id)}>
          Kreiraj ekipu i prijavi
        </PrimaryButton>
        {hint && (
          <Box component="span" sx={{fontSize: 13, color: color.muted, textAlign: "center"}}>
            {hint}
          </Box>
        )}
      </Box>
    </>
  );
}
