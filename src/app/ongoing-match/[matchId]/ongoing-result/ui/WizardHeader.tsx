"use client";

import {handPreview} from "@/app/_lib/bela/scoring";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import {Eyebrow} from "@/app/_ui/sp";
import {TeamValueBoxes} from "@/app/ongoing-match/ui/WizardParts";
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
  // Σ: what Spremi will save, pad and štiglja included (#48)
  const preview = handPreview({
    gamePoints1: gp(1),
    gamePoints2: gp(2),
    announcementPoints1: zv(1),
    announcementPoints2: zv(2),
    trumpCaller: result.trump_caller_team === 1 || result.trump_caller_team === 2 ? result.trump_caller_team : null,
    completeVictory: !!result.complete_victory,
  });
  const sumOf = (side: 1 | 2) => preview.sums[side - 1];

  return (
    <Box component="header" sx={{display: "flex", flexDirection: "column", gap: "12px", pb: "12px", flex: "none", viewTransitionName: "team-header"}}>
      <Eyebrow sx={{px: "4px"}}>Korak {step + 1} od 3</Eyebrow>
      <TeamValueBoxes
        names={sides.names}
        label={label}
        values={[isScore ? gp(sides.sides[0]) : zv(sides.sides[0]), isScore ? gp(sides.sides[1]) : zv(sides.sides[1])]}
        sums={isScore ? [sumOf(sides.sides[0]), sumOf(sides.sides[1])] : null}
        fell={isScore && preview.fell != null ? (sides.sides.indexOf(preview.fell) === 1 ? 1 : 0) : null}
        active={sides.sides.indexOf(active) === 1 ? 1 : 0}
        onPick={(i) => setActiveTeam(sides.key(sides.sides[i]))}
      />
    </Box>
  );
}
