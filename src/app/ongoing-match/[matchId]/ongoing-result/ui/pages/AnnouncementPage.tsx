"use client";

import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import {color, font, teamColor} from "@/app/_styles/tokens";
import {ActionPair, buttonBase} from "@/app/_ui/sp";
import useMatchSides from "@/app/ongoing-match/ui/useMatchSides";
import {Box} from "@mui/material";
import {useParams, useRouter} from "next/navigation";
import {ActionProps} from "./TrumpCallerPage";

const ZVANJA = [20, 50, 100, 150, 200];

// Step 2: zvanja (announcements) for the team selected in the header
export default function AnnouncementPage({actionType}: ActionProps) {
  const router = useRouter();
  const params = useParams<{matchId: string; resultId?: string}>();
  const sides = useMatchSides();
  const activeTeam = useResultStore((s) => s.resultData.activeTeam);
  const teamsAnnouncements = useAnnouncementStore((s) => s.teamsAnnouncements);
  const noAnnouncements = useAnnouncementStore((s) => s.noAnnouncements);
  const {setAnnouncement, resetTeamAnnouncements} = useAnnouncementStore.getState();

  const side = activeTeam === "team2" ? 2 : 1;
  const index = sides.sides.indexOf(side);
  const counts = teamsAnnouncements[side]?.announcementCounts ?? {};
  const base = `/ongoing-match/${params.matchId}/ongoing-result/${actionType === "CREATE" ? "new" : params.resultId}`;

  return (
    <>
      <Box
        role="group"
        aria-label={`Zvanja: ${sides.names[index]}`}
        sx={{flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", alignContent: "center", py: "16px"}}
      >
        {ZVANJA.map((v) => {
          const cnt = counts[v] ?? 0;
          return (
            <Box
              key={v}
              component="button"
              type="button"
              onClick={() => setAnnouncement(side, v)}
              aria-label={`Zvanje ${v}${cnt ? `, upisano ${cnt}` : ""}`}
              sx={{
                ...buttonBase,
                position: "relative",
                height: 84,
                borderRadius: "20px",
                background: color.cream,
                color: color.navy,
                fontFamily: font.display,
                fontSize: 30,
                fontWeight: 800,
                transition: "transform 120ms ease",
                "&:active": {transform: "scale(.95)"},
              }}
            >
              {v}
              <Box
                key={`${side}-${cnt}`}
                component="span"
                aria-hidden
                sx={{
                  position: "absolute",
                  top: "-7px",
                  right: "-7px",
                  minWidth: 28,
                  height: 28,
                  px: "7px",
                  boxSizing: "border-box",
                  borderRadius: "14px",
                  background: teamColor[index],
                  color: "#FFFFFF",
                  fontFamily: font.body,
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 0 3px ${color.paper}`,
                  opacity: cnt ? 1 : 0,
                  transform: cnt ? "scale(1)" : "scale(.4)",
                  transition: "opacity 160ms ease, transform 200ms ease, background 200ms ease",
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
          onClick={() => resetTeamAnnouncements(side)}
          sx={{
            ...buttonBase,
            height: 84,
            borderRadius: "20px",
            border: `2px solid ${color.borderStrong}`,
            color: color.navy,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.15,
            px: "8px",
            textAlign: "center",
          }}
        >
          Obriši zvanja
        </Box>
      </Box>
      <ActionPair
        onBack={() => router.back()}
        nextLabel={noAnnouncements ? "Nema Zvanja" : "Dalje"}
        onNext={() => router.push(`${base}/score`)}
      />
    </>
  );
}
