import {create} from "zustand";

// "Sjedni za stol." ("Gost i poziv" G4): the sheet a guest gets on Prijavi se or on anything locked. next: the page to
// come back to after making an account and logging in. why: a tournament's sign-up or a page only players see.
export type GuestSheetWhy = "signup" | "locked";

type GuestSheetState = {
  open: boolean;
  next: string | null;
  why: GuestSheetWhy;
  show: (next: string | null, why?: GuestSheetWhy) => void;
  close: () => void;
};

const useGuestSheet = create<GuestSheetState>()((set) => ({
  open: false,
  next: null,
  why: "locked",
  show: (next, why = "locked") => set({open: true, next, why}),
  close: () => set({open: false}),
}));

export default useGuestSheet;
