"use client";

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

  return (
    <Box component="header" sx={{display: "flex", flexDirection: "column", gap: "12px", pb: "12px", flex: "none", viewTransitionName: "team-header"}}>
      <Eyebrow sx={{px: "4px"}}>Korak {step + 1} od 3</Eyebrow>
      <TeamValueBoxes
        names={sides.names}
        label={label}
        values={[isScore ? gp(sides.sides[0]) : zv(sides.sides[0]), isScore ? gp(sides.sides[1]) : zv(sides.sides[1])]}
        sums={isScore ? [gp(sides.sides[0]) + zv(sides.sides[0]), gp(sides.sides[1]) + zv(sides.sides[1])] : null}
        active={sides.sides.indexOf(active) === 1 ? 1 : 0}
        onPick={(i) => setActiveTeam(sides.key(sides.sides[i]))}
      />
    </Box>
  );
}
