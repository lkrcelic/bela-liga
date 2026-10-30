"use client";

import {authHref} from "@/app/_lib/publicPaths";
import {TransitionLink} from "@/app/_lib/viewTransitions";
import useAuthStore from "@/app/_store/authStore";
import useGuestSheet from "@/app/_store/guestSheetStore";
import {color, ease, font, shadow, tint} from "@/app/_styles/tokens";
import {buttonBase} from "@/app/_ui/sp";
import {Box, Drawer} from "@mui/material";
import {useId} from "react";

// the four suits fanned out over the title, as designed
const SUITS = [
  {s: "♥", bg: color.white, ink: color.red, turn: -8},
  {s: "♠", bg: color.white, ink: color.ink, turn: -2},
  {s: "♦", bg: color.white, ink: color.red, turn: 4},
  {s: "♣", bg: color.cream, ink: color.ink, turn: 10},
];

// "Sjedni za stol." ("Gost i poziv" G4): a navy sheet for someone without an account who pressed Prijavi se or something
// locked. Napravi račun and Prijavi se both come back to the page that opened it (useGuestSheet's next). Mounted once
// in the layout; nothing for a player who is logged in.
export default function GuestSheet() {
  const {open, next, why, close} = useGuestSheet();
  const signedIn = useAuthStore((s) => s.user != null);
  const titleId = useId();
  if (signedIn) return null;
  const link = {...buttonBase, textDecoration: "none"} as const;
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={close}
      transitionDuration={{enter: 260, exit: 200}}
      SlideProps={{easing: {enter: ease, exit: "cubic-bezier(.4,0,.6,1)"}}}
      slotProps={{backdrop: {sx: {background: tint.scrim[42]}}}}
      PaperProps={{
        role: "dialog",
        "aria-labelledby": titleId,
        sx: {
          maxWidth: 560,
          mx: "auto",
          borderRadius: "32px 32px 0 0",
          background: color.navy,
          color: color.white,
          boxShadow: shadow.sheet,
          p: "12px 22px calc(30px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          overflow: "hidden",
        },
      }}
    >
      <Box aria-hidden sx={{alignSelf: "center", width: 40, height: 5, borderRadius: "3px", background: tint.creamOnNavy[45]}} />
      <Box aria-hidden sx={{display: "flex", alignItems: "center", gap: "10px", pt: "4px"}}>
        {SUITS.map((c) => (
          <Box
            key={c.s}
            component="span"
            sx={{width: 46, height: 58, borderRadius: "10px", background: c.bg, color: c.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, transform: `rotate(${c.turn}deg)`, boxShadow: shadow.playingCard}}
          >
            {c.s}
          </Box>
        ))}
      </Box>
      <Box sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
        <Box component="h2" id={titleId} sx={{m: 0, fontFamily: font.display, fontSize: 34, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-.02em"}}>
          Sjedni za stol.
        </Box>
        <Box component="p" sx={{m: 0, fontSize: 16, lineHeight: 1.45, color: color.cream, textWrap: "pretty"}}>
          {why === "signup"
            ? "Za prijavu na turnir treba ti račun. Traje minutu, a s njim dobivaš i rejting, ligu i Burzu igrača."
            : "Ovo vide samo igrači s računom. Traje minutu, a s njim dobivaš i rejting, ligu i prijave na turnire."}
        </Box>
      </Box>
      <Box
        component={TransitionLink}
        href={authHref("/signup", next)}
        onClick={close}
        sx={{...link, height: 58, borderRadius: "18px", background: color.cream, color: color.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700}}
      >
        Napravi račun
      </Box>
      <Box component="span" sx={{textAlign: "center", fontSize: 15, color: color.cream}}>
        Već imaš račun?{" "}
        <Box component={TransitionLink} href={authHref("/login", next)} onClick={close} sx={{...link, display: "inline", fontWeight: 700, color: color.white, textDecoration: "underline", textUnderlineOffset: "3px"}}>
          Prijavi se
        </Box>
      </Box>
    </Drawer>
  );
}

