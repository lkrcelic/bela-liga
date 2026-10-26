"use client";

import {AdminTournament, TournamentRequest} from "@/app/_interfaces/tournament";
import {isIsoDate, isSafeUrl, isStartTime} from "@/app/_lib/nights";
import {color, font, tint} from "@/app/_styles/tokens";
import {PlaceDraft, PlaceFields} from "@/app/_ui/admin/GatheringForm";
import {buttonBase, Field, mergeSx, Segmented, TextField, TextInput, TimeField} from "@/app/_ui/sp";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {Box, SxProps, Theme} from "@mui/material";
import React, {useMemo, useState} from "react";

// Novi turnir and Upravljanje turnirom · Podaci (desktop and phone): one form for the whole tournament. Every field
// as it is typed, the checks before anything is sent, and the request the server takes.

export type PrizeDraft = {prize: string; description: string};

export type TournamentDraft = {
  name: string;
  date: string;
  gathering: string;
  start: string;
  place: PlaceDraft;
  rounds: string;
  matches: 1 | 2;
  declarations: boolean;
  // "" = no limit
  maxTeams: string;
  fee: string;
  rulesUrl: string;
  prizes: PrizeDraft[];
};

export const EMPTY_TOURNAMENT: TournamentDraft = {
  name: "",
  date: "",
  gathering: "09:30",
  start: "10:00",
  place: {name: "", address: "", url: ""},
  rounds: "9",
  matches: 2,
  declarations: true,
  maxTeams: "",
  fee: "0",
  rulesUrl: "",
  prizes: [{prize: "", description: ""}],
};

type Source = Pick<
  AdminTournament,
  "name" | "date" | "gathering_time" | "start_time" | "location" | "rounds" | "matches_per_round" | "declarations" | "max_teams" | "entry_fee" | "rules_url" | "prizes"
>;

export function draftOf(t: Source): TournamentDraft {
  return {
    name: t.name,
    date: t.date,
    gathering: t.gathering_time ?? "",
    start: t.start_time ?? "",
    place: {name: t.location.name ?? "", address: t.location.address ?? "", url: t.location.url ?? ""},
    rounds: String(t.rounds),
    matches: t.matches_per_round === 1 ? 1 : 2,
    declarations: t.declarations,
    maxTeams: t.max_teams == null ? "" : String(t.max_teams),
    fee: String(t.entry_fee),
    rulesUrl: t.rules_url ?? "",
    prizes: t.prizes.length ? t.prizes.map((p) => ({prize: p.prize, description: p.description})) : [{prize: "", description: ""}],
  };
}

// Kopiraj turnir: everything but the date, the sign-ups and the prizes
export function copyOf(t: Source): TournamentDraft {
  return {...draftOf(t), date: "", prizes: [{prize: "", description: ""}]};
}

const wholeNumber = (v: string) => /^\d+$/.test(v.trim());

export type FormErrors = Partial<Record<"name" | "date" | "gathering" | "start" | "rounds" | "maxTeams" | "fee" | "rulesUrl" | "placeUrl" | "prizes", string>>;

// What is wrong, field by field (the server checks the same and says it in the same words)
export function draftErrors(d: TournamentDraft): FormErrors {
  const e: FormErrors = {};
  if (!d.name.trim()) e.name = "Upiši naziv turnira.";
  if (!d.date) e.date = "Odaberi datum turnira.";
  else if (!isIsoDate(d.date)) e.date = "Datum nije ispravan.";
  if (d.gathering && !isStartTime(d.gathering)) e.gathering = "Vrijeme mora biti od 00:00 do 23:59.";
  if (d.start && !isStartTime(d.start)) e.start = "Vrijeme mora biti od 00:00 do 23:59.";
  if (!wholeNumber(d.rounds) || Number(d.rounds) < 1 || Number(d.rounds) > 20) e.rounds = "Turnir ima od 1 do 20 kola.";
  if (d.maxTeams.trim() && (!wholeNumber(d.maxTeams) || Number(d.maxTeams) < 2)) e.maxTeams = "Najmanje dvije ekipe, ili ostavi prazno.";
  if (!wholeNumber(d.fee || "0") || Number(d.fee || "0") > 999) e.fee = "Kotizacija je od 0 do 999 €.";
  if (d.rulesUrl.trim() && !isSafeUrl(d.rulesUrl)) e.rulesUrl = "Link mora počinjati s https://.";
  if (d.place.url.trim() && !isSafeUrl(d.place.url)) e.placeUrl = "Link mora počinjati s https://.";
  if (d.prizes.some((p) => !p.prize.trim() && p.description.trim())) e.prizes = "Upiši nagradu za svako mjesto ili makni redak.";
  return e;
}

// The request: empty fields as null, the prize rows left empty dropped
export function draftPayload(d: TournamentDraft): TournamentRequest {
  const text = (v: string) => (v.trim() ? v.trim() : null);
  return {
    name: d.name.trim(),
    date: d.date,
    gathering_time: text(d.gathering),
    start_time: text(d.start),
    location_name: text(d.place.name),
    location_address: text(d.place.address),
    location_url: text(d.place.url),
    rounds: Number(d.rounds),
    matches_per_round: d.matches,
    declarations: d.declarations,
    max_teams: d.maxTeams.trim() ? Number(d.maxTeams) : null,
    entry_fee: Number(d.fee || "0"),
    rules_url: text(d.rulesUrl),
    prizes: d.prizes.filter((p) => p.prize.trim()).map((p) => ({prize: p.prize.trim(), description: p.description.trim()})),
  };
}

// The form's state: the draft, what changed since `base`, and the errors. rebase: the tournament as saved becomes what
// the form compares with
export function useTournamentForm(initial: TournamentDraft) {
  const [base, setBase] = useState<TournamentDraft>(initial);
  const [draft, setDraft] = useState<TournamentDraft>(initial);
  const [touched, setTouched] = useState(false);
  const rebase = (next: TournamentDraft) => {
    setBase(next);
    setDraft(next);
  };
  const set = <K extends keyof TournamentDraft>(k: K, v: TournamentDraft[K]) => {
    setDraft((p) => ({...p, [k]: v}));
    setTouched(true);
  };
  const errors = useMemo(() => draftErrors(draft), [draft]);
  const dirty = JSON.stringify(draftPayload(draft)) !== JSON.stringify(draftPayload(base));
  return {draft, setDraft, set, errors, valid: Object.keys(errors).length === 0, dirty, touched, reset: () => setDraft(base), rebase};
}

export type TournamentFormState = ReturnType<typeof useTournamentForm>;

// What can't change once the tournament started (the server refuses it too)
export type FormLocks = {started: boolean; registered: number};

function SectionTitle({children}: {children: React.ReactNode}) {
  return (
    <Box component="h2" sx={{m: 0, fontFamily: font.display, fontSize: 20, fontWeight: 800, color: color.ink}}>
      {children}
    </Box>
  );
}

const rule = {height: "1px", background: color.line, border: 0, m: "4px 0"} as const;

// The two-choice fields (Partija po kolu 1 · 2, Zvanja Da · Ne)
function Choice<K extends string | number>({label, value, items, onChange, disabled}: {label: string; value: K; items: {key: K; label: string}[]; onChange: (k: K) => void; disabled?: boolean}) {
  return (
    <Box sx={{display: "flex", flexDirection: "column", gap: "6px", minWidth: 0, opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? "none" : "auto"}}>
      <Box component="span" sx={{fontSize: 14, fontWeight: 600, color: color.ink2, pl: "4px"}}>
        {label}
      </Box>
      <Segmented<K> items={items} value={value} onChange={onChange} label={label} variant="track" size={46} asTabs={false} />
    </Box>
  );
}

// The prizes: one row per place (1., 2., …), with Dodaj nagradu
function PrizeRows({prizes, onChange, compact}: {prizes: PrizeDraft[]; onChange: (p: PrizeDraft[]) => void; compact: boolean}) {
  const setRow = (i: number, k: keyof PrizeDraft, v: string) => onChange(prizes.map((p, j) => (j === i ? {...p, [k]: v} : p)));
  return (
    <Box sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
      {prizes.map((p, i) => (
        <Box
          key={i}
          sx={{display: "grid", gridTemplateColumns: compact ? "36px minmax(0,1fr) 40px" : "36px minmax(0,0.8fr) minmax(0,1.2fr) 40px", gap: "8px", alignItems: "center"}}
        >
          <Box
            component="span"
            aria-hidden
            sx={{width: 36, height: 36, borderRadius: "10px", background: i < 3 ? color.medalBg[i] : color.lineFill, color: i < 3 ? color.medal[i] : color.muted, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", ...(compact && {gridRow: "span 2"})}}
          >
            {i + 1}
          </Box>
          <TextInput soft aria-label={`${i + 1}. mjesto · nagrada`} placeholder="npr. 300 €" maxLength={100} value={p.prize} onChange={(e) => setRow(i, "prize", e.target.value)} sx={{height: 48}} />
          {!compact && (
            <TextInput soft aria-label={`${i + 1}. mjesto · opis`} placeholder="npr. Pehar i medalje" maxLength={200} value={p.description} onChange={(e) => setRow(i, "description", e.target.value)} sx={{height: 48}} />
          )}
          <Box
            component="button"
            type="button"
            onClick={() => onChange(prizes.filter((_, j) => j !== i))}
            aria-label={`Makni nagradu za ${i + 1}. mjesto`}
            sx={{...buttonBase, width: 40, height: 40, borderRadius: "12px", color: color.faint, display: "flex", alignItems: "center", justifyContent: "center", "&:hover": {background: tint.red[10], color: color.red}, ...(compact && {gridRow: "span 2"})}}
          >
            <DeleteRoundedIcon sx={{fontSize: 20}} />
          </Box>
          {compact && (
            <TextInput soft aria-label={`${i + 1}. mjesto · opis`} placeholder="npr. Pehar i medalje" maxLength={200} value={p.description} onChange={(e) => setRow(i, "description", e.target.value)} sx={{height: 48}} />
          )}
        </Box>
      ))}
      <Box
        component="button"
        type="button"
        onClick={() => onChange([...prizes, {prize: "", description: ""}])}
        sx={{...buttonBase, alignSelf: "flex-start", height: 42, display: "flex", alignItems: "center", gap: "6px", px: "12px", borderRadius: "12px", color: color.navy, fontSize: 14, fontWeight: 700, "&:hover": {background: color.paper}, "& svg": {fontSize: 20}}}
      >
        <AddRoundedIcon aria-hidden />
        Dodaj nagradu
      </Box>
    </Box>
  );
}

// The whole form. compact: the phone's one column. locks: a started tournament keeps its date and format.
export function TournamentFields({form, locks, compact = false, sx}: {form: TournamentFormState; locks?: FormLocks; compact?: boolean; sx?: SxProps<Theme>}) {
  const {draft: d, set, errors} = form;
  const started = locks?.started ?? false;
  const input = {height: 52} as const;
  const lowered = !started && locks && d.maxTeams.trim() && Number(d.maxTeams) < locks.registered;
  const columns = (n: number) => ({display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : `repeat(${n}, minmax(0,1fr))`, gap: "14px"});
  return (
    <Box sx={mergeSx({display: "flex", flexDirection: "column", gap: "16px"}, sx)}>
      <SectionTitle>Osnovno</SectionTitle>
      <TextField label="Naziv turnira" placeholder="npr. Jesenski turnir" maxLength={100} value={d.name} onChange={(e) => set("name", e.target.value)} soft inputSx={input} error={form.touched ? errors.name : undefined} />
      <Box sx={columns(3)}>
        <Field label="Datum" error={form.touched ? errors.date : started ? "Turnir je počeo: datum se ne mijenja." : undefined} errorSx={started ? {color: color.muted} : undefined}>
          {(a11y) => <TextInput {...a11y} type="date" soft value={d.date} disabled={started} onChange={(e) => set("date", e.target.value)} sx={input} />}
        </Field>
        <TimeField label="Okupljanje" value={d.gathering} onChange={(v) => set("gathering", v)} clearLabel="Ukloni vrijeme okupljanja" soft inputSx={input} error={errors.gathering} />
        <TimeField label="Početak" value={d.start} onChange={(v) => set("start", v)} clearLabel="Ukloni početak" soft inputSx={input} error={errors.start} />
      </Box>

      <Box component="hr" sx={rule} />
      <SectionTitle>Mjesto</SectionTitle>
      <PlaceFields value={d.place} onChange={(p) => set("place", p)} inputSx={input} />
      {errors.placeUrl && (
        <Box role="alert" sx={{mt: "-8px", pl: "4px", fontSize: 14, fontWeight: 600, color: color.red}}>
          {errors.placeUrl}
        </Box>
      )}

      <Box component="hr" sx={rule} />
      <SectionTitle>Format i prijave</SectionTitle>
      <Box sx={columns(3)}>
        <TextField label="Broj kola" type="number" inputMode="numeric" min={1} max={20} value={d.rounds} onChange={(e) => set("rounds", e.target.value)} soft inputSx={input} error={errors.rounds} />
        <Choice<1 | 2> label="Partija po kolu" value={d.matches} items={[{key: 1, label: "1"}, {key: 2, label: "2"}]} onChange={(v) => set("matches", v)} disabled={started} />
        <Choice<"da" | "ne"> label="Zvanja" value={d.declarations ? "da" : "ne"} items={[{key: "da", label: "Da"}, {key: "ne", label: "Ne"}]} onChange={(v) => set("declarations", v === "da")} disabled={started} />
      </Box>
      <Box sx={columns(3)}>
        <Field
          label="Najveći broj ekipa"
          error={errors.maxTeams ?? (lowered ? `Prijavljeno je ${locks!.registered} ekipa: zadnje prijavljene idu na listu čekanja.` : undefined)}
        >
          {(a11y) => (
            <TextInput {...a11y} type="number" inputMode="numeric" min={2} placeholder="Bez ograničenja" soft value={d.maxTeams} disabled={started} onChange={(e) => set("maxTeams", e.target.value)} sx={input} />
          )}
        </Field>
        <Field label="Kotizacija po igraču · €" error={errors.fee}>
          {(a11y) => <TextInput {...a11y} type="number" inputMode="numeric" min={0} max={999} soft value={d.fee} onChange={(e) => set("fee", e.target.value)} sx={input} />}
        </Field>
        <TextField
          label="Link na pravila"
          type="url"
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="https://…"
          maxLength={500}
          value={d.rulesUrl}
          onChange={(e) => set("rulesUrl", e.target.value)}
          soft
          inputSx={input}
          error={errors.rulesUrl}
        />
      </Box>
      <Box sx={{mt: "-6px", pl: "4px", fontSize: 13, lineHeight: 1.45, color: color.muted}}>
        Prazno = bez ograničenja; kad je turnir pun, ekipe idu na listu čekanja. Kotizacija 0 € = igrači vide „Bez stresa, bez obveza”.
      </Box>

      <Box component="hr" sx={rule} />
      <SectionTitle>Nagrade</SectionTitle>
      <PrizeRows prizes={d.prizes} onChange={(p) => set("prizes", p)} compact={compact} />
      {errors.prizes && (
        <Box role="alert" sx={{pl: "4px", fontSize: 14, fontWeight: 600, color: color.red}}>
          {errors.prizes}
        </Box>
      )}
    </Box>
  );
}
