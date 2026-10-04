"use client";

import useResultStore from "@/app/_store/bela/resultStore";
import useRoundStore from "@/app/_store/RoundStore";
import {color, ease, font, teamColor} from "@/app/_styles/tokens";
import {ActionPair, buttonBase, ScreenTitle} from "@/app/_ui/sp";
import {discardHand} from "@/app/ongoing-match/ui/handFlow";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {Box} from "@mui/material";
import {useParams} from "next/navigation";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";

export type ActionProps = {
  actionType: "CREATE" | "UPDATE";
};

// Step 1: which team called trumps
export default function TrumpCallerPage({actionType}: ActionProps) {
  const router = useTransitionRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const sides = useMatchSides();
  const caller = useResultStore((s) => s.resultData.trump_caller_team);
  const setTrumpCallerTeam = useResultStore((s) => s.setTrumpCallerTeam);
  const roundLoaded = useRoundStore((s) => s.roundData?.id != null);

  const base = `/ongoing-match/${params.matchId}/ongoing-result/${actionType === "CREATE" ? "new" : params.resultId}`;

  const back = () => {
    discardHand();
    // the wizard is opened from the scoreboard, so going back keeps the history tidy
    if (window.history.length > 1) router.back();
    else router.push(`/ongoing-match/${params.matchId}`, "back");
  };

  return (
    <>
      <ScreenTitle eyebrow="Korak 1 od 3" title="Izaberi tko je zvao" sx={{pt: 0}} />
      <Box
        role="radiogroup"
        aria-label="Tko je zvao"
        sx={{flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignContent: "center", py: "16px"}}
      >
        {sides.sides.map((side, i) => {
          const on = caller === side;
          return (
            <Box
              key={side}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!roundLoaded}
              onClick={() => setTrumpCallerTeam(side)}
              sx={{
                ...buttonBase,
                position: "relative",
                height: 200,
                borderRadius: "24px",
                border: `2.5px solid ${teamColor[i]}`,
                background: color.card,
                overflow: "hidden",
                animation: on ? "spSel 420ms cubic-bezier(.3,1.4,.5,1)" : "none",
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 270,
                  height: 270,
                  borderRadius: "50%",
                  background: teamColor[i],
                  transform: `translate(-50%,-50%) scale(${on ? 1 : 0})`,
                  transition: `transform 360ms ${ease}`,
                }}
              />
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  px: "10px",
                  color: on ? "#FFFFFF" : teamColor[i],
                  transition: "color 200ms ease",
                }}
              >
                <CheckCircleRoundedIcon
                  aria-hidden
                  sx={{
                    fontSize: 34,
                    opacity: on ? 1 : 0,
                    transform: on ? "scale(1)" : "scale(.4)",
                    transition: "opacity 200ms ease 120ms, transform 300ms cubic-bezier(.3,1.5,.5,1) 120ms",
                  }}
                />
                <Box component="span" sx={{fontFamily: font.display, fontSize: 22, fontWeight: 700, overflowWrap: "anywhere", textAlign: "center"}}>
                  {sides.names[i]}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      <ActionPair onBack={back} nextLabel="Dalje" onNext={() => router.push(`${base}/announcement`)} nextDisabled={caller == null} />
    </>
  );
}
