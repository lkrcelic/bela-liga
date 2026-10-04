"use client";

import {TeamSide} from "@/app/_interfaces/belaPlayerAnnouncement";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import {color, font, teamColor} from "@/app/_styles/tokens";
import {buttonBase, Card, ErrorNote, PrimaryButton, tabular} from "@/app/_ui/sp";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {Box} from "@mui/material";
import {useEffect, useState} from "react";
import {discardHand, saveHand} from "./handFlow";

const ZVANJA = [20, 50, 100, 150, 200];

// Desktop: caller, zvanja and keypad in one panel next to the scoreboard
export default function HandEntryPanel({
  matchId,
  sides,
  names,
  handNumber,
  editingId,
  onSaved,
  onCancelEdit,
}: {
  matchId: number;
  sides: [TeamSide, TeamSide];
  names: [string, string];
  handNumber: number;
  editingId: number | null;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const result = useResultStore((s) => s.resultData);
  const {setTrumpCallerTeam, setActiveTeam, setGamePoints, resetScore, setCompleteVictory, setMatchId} = useResultStore.getState();
  const teamsAnnouncements = useAnnouncementStore((s) => s.teamsAnnouncements);
  const {setAnnouncement, resetTeamAnnouncements} = useAnnouncementStore.getState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSide: TeamSide = result.activeTeam === "team2" ? 2 : 1;
  const gp = (side: TeamSide) => (side === 1 ? result.player_pair1_game_points : result.player_pair2_game_points) ?? 0;
  const zv = (side: TeamSide) => teamsAnnouncements[side]?.totalAnnouncements ?? 0;
  const caller = result.trump_caller_team;
  const canSave = (caller === 1 || caller === 2) && (gp(1) > 0 || gp(2) > 0);
  const counts = teamsAnnouncements[activeSide]?.announcementCounts ?? {};
  const activeIndex = sides.indexOf(activeSide) as 0 | 1;

  // a fresh hand starts with the viewer's team active. Depends on the side itself, not the sides array (a new array
  // on every render): the board re-renders on each refresh, which must not move the keypad to the other team.
  const viewerSide = sides[0];
  useEffect(() => {
    if (editingId == null) {
      // a hand left over from another match is dropped, one from this match is kept (e.g. after a reload)
      const pending = useResultStore.getState().resultData.match_id;
      if (pending != null && pending !== matchId) discardHand();
      setMatchId(matchId);
      setActiveTeam(viewerSide === 1 ? "team1" : "team2");
    }
  }, [editingId, matchId, viewerSide, setMatchId, setActiveTeam]);

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveHand(matchId, editingId);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spremanje nije uspjelo.");
    }
    setSaving(false);
  };

  // number keys type points, Enter saves (when the focus is not in a text field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key) && !result.complete_victory) {
        setGamePoints(Number(e.key));
        e.preventDefault();
      } else if (e.key === "Enter" && t?.tagName !== "BUTTON") {
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reset = () => {
    discardHand();
    setError(null);
    setMatchId(matchId);
    setActiveTeam(sides[0] === 1 ? "team1" : "team2");
    if (editingId != null) onCancelEdit();
  };

  const stiglja = () => {
    if (caller !== 1 && caller !== 2) {
      setError("Prvo odaberi tko je zvao.");
      return;
    }
    setError(null);
    setCompleteVictory();
  };

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

  return (
    <Card
      component="section"
      aria-labelledby="entry-title"
      sx={{minHeight: 0, borderRadius: "24px", p: "20px", display: "flex", flexDirection: "column", gap: "14px"}}
    >
      <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <Box component="h2" id="entry-title" sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800}}>
          {editingId != null ? `Uredi igru ${handNumber}` : `Igra ${handNumber}`}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={reset}
          sx={{...buttonBase, height: 36, px: "12px", borderRadius: "10px", background: color.paper, color: color.navy, fontSize: 14, fontWeight: 600}}
        >
          {editingId != null ? "Odustani" : "Poništi"}
        </Box>
      </Box>

      <Box role="radiogroup" aria-labelledby="caller-label" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
        <Box id="caller-label" sx={{fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: color.muted}}>
          Tko je zvao
        </Box>
        <Box sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "10px"}}>
          {sides.map((side, i) => {
            const on = caller === side;
            return (
              <Box
                key={side}
                component="button"
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTrumpCallerTeam(side)}
                sx={{
                  ...buttonBase,
                  height: 52,
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
                  minWidth: 0,
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

      <Box role="radiogroup" aria-label="Upis za ekipu" sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "10px"}}>
        {sides.map((side, i) => {
          const on = activeSide === side;
          return (
            <Box
              key={side}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${names[i]}: zvanja ${zv(side)}, igra ${gp(side)}`}
              onClick={() => setActiveTeam(side === 1 ? "team1" : "team2")}
              sx={{
                ...buttonBase,
                height: 84,
                borderRadius: "16px",
                border: `2px solid ${teamColor[i]}`,
                background: on ? teamColor[i] : color.card,
                color: on ? "#FFFFFF" : teamColor[i],
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                px: "14px",
                textAlign: "left",
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              <Stat label="Zvanja" value={zv(side)} size={26} />
              <Stat label="Igra" value={gp(side)} size={34} />
            </Box>
          );
        })}
      </Box>

      <Box sx={{display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "8px"}}>
        {ZVANJA.map((v) => {
          const cnt = counts[v] ?? 0;
          return (
            <Box
              key={v}
              component="button"
              type="button"
              onClick={() => setAnnouncement(activeSide, v)}
              aria-label={`Zvanje ${v}${cnt ? `, upisano ${cnt}` : ""}`}
              sx={{
                ...buttonBase,
                position: "relative",
                height: 52,
                borderRadius: "14px",
                background: color.cream,
                color: color.navy,
                fontFamily: font.display,
                fontSize: 20,
                fontWeight: 800,
                "&:active": {transform: "scale(.95)"},
              }}
            >
              {v}
              <Box
                key={cnt}
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
                  background: teamColor[activeIndex],
                  color: "#FFFFFF",
                  fontFamily: font.body,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 2px #FFFFFF",
                  opacity: cnt ? 1 : 0,
                  animation: cnt ? "spPop 320ms ease" : "none",
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
          onClick={() => resetTeamAnnouncements(activeSide)}
          aria-label="Obriši zvanja"
          title="Obriši zvanja"
          sx={{
            ...buttonBase,
            height: 52,
            borderRadius: "14px",
            border: `2px solid rgba(60,74,103,.25)`,
            color: color.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DeleteRoundedIcon sx={{fontSize: 22}} />
        </Box>
      </Box>

      <Box
        role="group"
        aria-label="Bodovi igre"
        sx={{flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gridAutoRows: "minmax(0,1fr)", gap: "8px"}}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <Box key={d} component="button" type="button" onClick={() => setGamePoints(d)} disabled={result.complete_victory} sx={key}>
            {d}
          </Box>
        ))}
        <Box
          component="button"
          type="button"
          onClick={stiglja}
          aria-pressed={result.complete_victory}
          sx={{...key, background: color.cream, color: color.navy, fontFamily: font.body, fontSize: 16}}
        >
          Štiglja
        </Box>
        <Box component="button" type="button" onClick={() => setGamePoints(0)} disabled={result.complete_victory} sx={key}>
          0
        </Box>
        <Box
          component="button"
          type="button"
          onClick={resetScore}
          aria-label="Obriši bodove"
          sx={{...key, background: "transparent", border: `2px solid rgba(60,74,103,.25)`, color: color.navy, fontSize: 22}}
        >
          X
        </Box>
      </Box>

      {error && <ErrorNote>{error}</ErrorNote>}
      <PrimaryButton icon={<AddCircleRoundedIcon />} onClick={save} disabled={!canSave} loading={saving}>
        {editingId != null ? "Spremi izmjene" : "Spremi igru"}
      </PrimaryButton>
    </Card>
  );
}

function Stat({label, value, size}: {label: string; value: number; size: number}) {
  return (
    <Box component="span" sx={{display: "flex", flexDirection: "column", gap: "2px"}}>
      <Box component="span" sx={{fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase"}}>
        {label}
      </Box>
      <Box component="span" sx={{fontFamily: font.display, fontSize: size, fontWeight: 800, lineHeight: 1, ...tabular}}>
        {value}
      </Box>
    </Box>
  );
}
