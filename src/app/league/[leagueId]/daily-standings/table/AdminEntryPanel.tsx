"use client";

import {
  addZvanje,
  canSave,
  clearPoints,
  clearZvanja,
  EntryState,
  setActive,
  setCaller,
  setStiglja,
  switchMode,
  typeDigit,
  ZVANJA,
  zvanjaPoints,
} from "@/app/_lib/ui/adminEntry";
import {Side} from "@/app/_lib/bela/scoring";
import {color, font, teamColor} from "@/app/_styles/tokens";
import {buttonBase, Card, ErrorNote, PrimaryButton, tabular} from "@/app/_ui/sp";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";
import {Box} from "@mui/material";
import React, {useEffect, useRef} from "react";

const SIDES: Side[] = [1, 2];

// The right-hand panel of the admin scorepad: enter a new hand or change the selected one
export default function AdminEntryPanel({
  entry,
  onChange,
  names,
  title,
  editing,
  saving,
  error,
  onSave,
  onCancel,
  onDelete,
  finish,
}: {
  entry: EntryState;
  onChange: (s: EntryState) => void;
  names: [string, string];
  title: string;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  // the selected match has a winner and can be finished (instead of saving hands)
  finish: {winner: string; color: string; onFinish: () => void; busy: boolean} | null;
}) {
  const manual = entry.mode === "man";
  const counts = entry.zvanja[entry.active];
  const savable = canSave(entry);

  // number keys type points, Enter saves (when the focus is not in a text field)
  const latest = useRef({entry, onChange, onSave, savable});
  latest.current = {entry, onChange, onSave, savable};
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const {entry: s, onChange: change, onSave: save, savable: ok} = latest.current;
      if (/^[0-9]$/.test(e.key)) {
        change(typeDigit(s, Number(e.key)));
        e.preventDefault();
      } else if (e.key === "Enter" && t?.tagName !== "BUTTON" && ok) {
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const key = {
    ...buttonBase,
    borderRadius: "14px",
    background: color.paper,
    color: color.ink,
    fontFamily: font.display,
    fontSize: 26,
    fontWeight: 700,
    minHeight: 44,
    "&:active:not(:disabled)": {transform: "scale(.96)", background: "#EAE4D6"},
    "&:disabled": {opacity: 0.35},
  } as const;
  const small = {...buttonBase, height: 36, px: "12px", borderRadius: "10px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", "& svg": {fontSize: 18}} as const;

  return (
    <Card component="section" aria-labelledby="admin-entry-title" sx={{minHeight: 0, borderRadius: "24px", p: "20px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto"}}>
      <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px"}}>
        <Box component="h2" id="admin-entry-title" sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800}}>
          {title}
        </Box>
        <Box sx={{display: "flex", gap: "8px"}}>
          {editing && (
            <Box component="button" type="button" onClick={onDelete} disabled={saving} sx={{...small, pl: "8px", background: "rgba(188,71,73,.1)", color: color.red}}>
              <DeleteRoundedIcon />
              Obriši igru
            </Box>
          )}
          <Box component="button" type="button" onClick={onCancel} sx={{...small, background: color.paper, color: color.navy}}>
            {editing ? "Odustani" : "Poništi"}
          </Box>
        </Box>
      </Box>

      <Box role="radiogroup" aria-label="Način unosa" sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "4px", p: "4px", borderRadius: "14px", background: color.paper}}>
        {(
          [
            ["std", "Standardni unos", <StyleRoundedIcon key="i" />],
            ["man", "Ručni unos", <EditNoteRoundedIcon key="i" />],
          ] as const
        ).map(([mode, label, icon]) => {
          const on = entry.mode === mode;
          return (
            <Box
              key={mode}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(switchMode(entry, mode))}
              sx={{
                ...buttonBase,
                height: 40,
                borderRadius: "11px",
                background: on ? color.card : "transparent",
                color: on ? color.ink : color.inkSoft,
                boxShadow: on ? "0 1px 3px rgba(31,36,51,.12)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: 14,
                fontWeight: 600,
                "& svg": {fontSize: 18},
              }}
            >
              {icon}
              {label}
            </Box>
          );
        })}
      </Box>

      {manual ? (
        <Box sx={{display: "flex", alignItems: "flex-start", gap: "10px", p: "10px 12px", borderRadius: "12px", background: "rgba(60,74,103,.07)", fontSize: 13, lineHeight: 1.4, "& svg": {fontSize: 18, color: color.navy, flex: "none"}}}>
          <InfoRoundedIcon />
          Upiši bodove za obje ekipe. Bez zvanja i bez ograničenja na 162.
        </Box>
      ) : (
        <Box role="radiogroup" aria-labelledby="admin-caller-label" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
          <Box id="admin-caller-label" sx={{fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted}}>
            Tko je zvao
          </Box>
          <Box sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "10px"}}>
            {SIDES.map((side, i) => {
              const on = entry.caller === side;
              return (
                <Box
                  key={side}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange(setCaller(entry, side))}
                  sx={{
                    ...buttonBase,
                    height: 52,
                    minWidth: 0,
                    borderRadius: "14px",
                    border: `2px solid ${teamColor[i]}`,
                    background: on ? teamColor[i] : color.card,
                    color: on ? "#FFFFFF" : teamColor[i],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    px: "8px",
                    fontFamily: font.display,
                    fontSize: 18,
                    fontWeight: 700,
                    transition: "background 200ms ease, color 200ms ease",
                  }}
                >
                  {on && <CheckCircleRoundedIcon sx={{fontSize: 22}} />}
                  <Box component="span" sx={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                    {names[i]}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box role="radiogroup" aria-label="Upis za ekipu" sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "10px"}}>
        {SIDES.map((side, i) => {
          const on = entry.active === side;
          const points = entry.points[i];
          return (
            <Box
              key={side}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={manual ? `${names[i]}: ${points} bodova` : `${names[i]}: zvanja ${zvanjaPoints(entry.zvanja[side])}, igra ${points}`}
              onClick={() => onChange(setActive(entry, side))}
              sx={{
                ...buttonBase,
                height: 84,
                minWidth: 0,
                borderRadius: "16px",
                border: `2px solid ${teamColor[i]}`,
                background: on ? teamColor[i] : color.card,
                color: on ? "#FFFFFF" : teamColor[i],
                display: "grid",
                gridTemplateColumns: manual ? "minmax(0,1fr)" : "1fr 1fr",
                alignItems: "center",
                px: "14px",
                textAlign: "left",
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              {manual ? (
                <Stat label={names[i]} value={points} size={34} />
              ) : (
                <>
                  <Stat label="Zvanja" value={zvanjaPoints(entry.zvanja[side])} size={26} />
                  <Stat label="Igra" value={points} size={34} />
                </>
              )}
            </Box>
          );
        })}
      </Box>

      {!manual && (
        <Box sx={{display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "8px"}}>
          {ZVANJA.map((v) => {
            const cnt = counts[v];
            return (
              <Box
                key={v}
                component="button"
                type="button"
                onClick={() => onChange(addZvanje(entry, v))}
                aria-label={`Zvanje ${v}${cnt ? `, upisano ${cnt}` : ""}`}
                sx={{...buttonBase, position: "relative", height: 52, borderRadius: "14px", background: color.cream, color: color.navy, fontFamily: font.display, fontSize: 20, fontWeight: 800, "&:active": {transform: "scale(.95)"}}}
              >
                {v}
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    minWidth: 22,
                    height: 22,
                    px: "5px",
                    boxSizing: "border-box",
                    borderRadius: "11px",
                    background: teamColor[entry.active - 1],
                    color: "#FFFFFF",
                    fontFamily: font.body,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 2px #FFFFFF",
                    opacity: cnt ? 1 : 0,
                  }}
                >
                  {cnt || ""}
                </Box>
              </Box>
            );
          })}
          <Box
            component="button"
            type="button"
            onClick={() => onChange(clearZvanja(entry))}
            aria-label="Obriši zvanja"
            title="Obriši zvanja"
            sx={{...buttonBase, height: 52, borderRadius: "14px", border: `2px solid rgba(60,74,103,.25)`, color: color.navy, display: "flex", alignItems: "center", justifyContent: "center"}}
          >
            <DeleteRoundedIcon sx={{fontSize: 22}} />
          </Box>
        </Box>
      )}

      <Box role="group" aria-label="Bodovi" sx={{flex: 1, minHeight: 200, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gridAutoRows: "minmax(0,1fr)", gap: "8px"}}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <Box key={d} component="button" type="button" onClick={() => onChange(typeDigit(entry, d))} disabled={entry.stiglja} sx={key}>
            {d}
          </Box>
        ))}
        <Box
          component="button"
          type="button"
          onClick={() => onChange(setStiglja(entry))}
          disabled={manual}
          aria-pressed={entry.stiglja}
          sx={{...key, background: color.cream, color: color.navy, fontFamily: font.body, fontSize: 16}}
        >
          Štiglja
        </Box>
        <Box component="button" type="button" onClick={() => onChange(typeDigit(entry, 0))} disabled={entry.stiglja} sx={key}>
          0
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => onChange(clearPoints(entry))}
          aria-label="Obriši bodove"
          sx={{...key, background: "transparent", border: `2px solid rgba(60,74,103,.25)`, color: color.navy, fontSize: 22}}
        >
          X
        </Box>
      </Box>

      {error && <ErrorNote>{error}</ErrorNote>}
      {finish && !editing ? (
        <PrimaryButton icon={<EmojiEventsRoundedIcon />} bg={finish.color} onClick={finish.onFinish} loading={finish.busy}>
          Završi meč · {finish.winner}
        </PrimaryButton>
      ) : (
        <PrimaryButton icon={editing ? <CheckCircleRoundedIcon /> : <AddCircleRoundedIcon />} onClick={onSave} disabled={!savable} loading={saving}>
          {editing ? "Spremi izmjene" : "Spremi igru"}
        </PrimaryButton>
      )}
    </Card>
  );
}

function Stat({label, value, size}: {label: string; value: number; size: number}) {
  return (
    <Box component="span" sx={{display: "flex", flexDirection: "column", gap: "2px", minWidth: 0}}>
      <Box component="span" sx={{fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
        {label}
      </Box>
      <Box component="span" sx={{fontFamily: font.display, fontSize: size, fontWeight: 800, lineHeight: 1, ...tabular}}>
        {value}
      </Box>
    </Box>
  );
}
