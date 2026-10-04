"use client";

import {Screen} from "@/app/_ui/sp";
import WizardHeader from "@/app/ongoing-match/[matchId]/ongoing-result/ui/WizardHeader";
import {activeNavDirection} from "@/app/_lib/viewTransitions";
import {Box} from "@mui/material";
import {usePathname} from "next/navigation";
import React, {useState} from "react";

const STEPS = ["trump-caller", "announcement", "score"];

// Hand entry wizard frame. The team header stays mounted between the zvanja and game steps (it only changes its
// values); the step body slides in from the right going forward and from the left going back.
export default function Layout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const step = Math.max(0, STEPS.findIndex((s) => pathname.endsWith(`/${s}`)));
  // direction of the last step change (derived from the previous render, StrictMode safe)
  const [nav, setNav] = useState({step, direction: "forward"});
  if (nav.step !== step) setNav({step, direction: step > nav.step ? "forward" : "back"});
  const direction = nav.step !== step ? (step > nav.step ? "forward" : "back") : nav.direction;
  // a view transition already slides the page; the CSS slide is the fallback (older browsers, browser back button)
  const viaViewTransition = activeNavDirection() != null;

  return (
    <Screen fill gap={0} sx={{pt: "calc(22px + env(safe-area-inset-top))"}}>
      {step > 0 && <WizardHeader step={step} />}
      <Box
        key={pathname}
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          animation: viaViewTransition ? "none" : `${direction === "forward" ? "spStepIn" : "spStepBack"} 280ms cubic-bezier(.2,.8,.2,1) both`,
        }}
      >
        {children}
      </Box>
    </Screen>
  );
}
