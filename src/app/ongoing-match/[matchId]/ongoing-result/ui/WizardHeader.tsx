"use client";

import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import {color, font, teamColor} from "@/app/_styles/tokens";
import {buttonBase, Eyebrow, tabular} from "@/app/_ui/sp";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import {Box} from "@mui/material";
import {useEffect} from "react";

// Steps 2 and 3: the two team boxes pick which team the zvanja / points are entered for
export default function WizardHeader({step}: {step: number}) {
  const sides = useMatchSides();
  const result = useResultStore((s) => s.resultData);
  const setActiveTeam = useResultStore((s) => s.setActiveTeam);
  const teamsAnnouncements = useAnnouncementStore((s) => s.teamsAnnouncements);
  const isScore = step === 2;

  // each step starts with the viewer's team selected
  useEffect(() => {
    setActiveTeam(sides.key(sides.left));
  }, [step, sides.left]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = result.activeTeam === "team2" ? 2 : 1;
  const gp = (side: 1 | 2) => (side === 1 ? result.player_pair1_game_points : result.player_pair2_game_points) ?? 0;
  const zv = (side: 1 | 2) => teamsAnnouncements[side]?.totalAnnouncements ?? 0;
  const label = isScore ? "Igra" : "Zvanja";

  return (
    <Box component="header" sx={{display: "flex", flexDirection: "column", gap: "12px", pb: "12px", flex: "none"}}>
      <Eyebrow sx={{px: "4px"}}>Korak {step + 1} od 3</Eyebrow>
      <Box role="radiogroup" aria-label={`${label}: upis za ekipu`} sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
        {sides.sides.map((side, i) => {
          const on = active === side;
          const value = isScore ? gp(side) : zv(side);
          return (
            <Box key={side} sx={{display: "flex", flexDirection: "column", gap: "6px", minWidth: 0}}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${sides.names[i]}: ${label.toLowerCase()} ${value}`}
                onClick={() => setActiveTeam(sides.key(side))}
                sx={{
                  ...buttonBase,
                  height: 92,
                  borderRadius: "20px",
                  border: `2.5px solid ${teamColor[i]}`,
                  background: on ? teamColor[i] : color.card,
                  color: on ? "#FFFFFF" : teamColor[i],
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: "2px",
                  px: "16px",
                  transition: "background 200ms ease, color 200ms ease",
                  minWidth: 0,
                }}
              >
                <Box component="span" sx={{fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                  {label} · {sides.names[i]}
                </Box>
                <Box component="span" sx={{fontFamily: font.display, fontSize: 38, fontWeight: 800, lineHeight: 1, ...tabular}}>
                  {value}
                </Box>
              </Box>
              <Box aria-live="polite" sx={{height: 18, pl: "8px", fontSize: 14, fontWeight: 600, color: color.muted, ...tabular}}>
                {isScore ? `Σ ${gp(side) + zv(side)}` : ""}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
