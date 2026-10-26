// Which zvanja a hand can take (the scorepad's buttons): all five at a league's table and a tournament's with zvanja;
// at a tournament's table "bez zvanja" only bela, the king and queen of trumps (20), which only one team can have in
// a hand (the server checks the same: validateResult.ts declarationsError). Framework free.

export const ALL_ZVANJA = [20, 50, 100, 150, 200] as const;
export type ZvanjeValue = (typeof ALL_ZVANJA)[number];

export function zvanjaChoices(declarations: boolean): readonly ZvanjeValue[] {
  return declarations ? ALL_ZVANJA : [20];
}

// the button's text: the points, or "Bela" where nothing else counts
export const zvanjeLabel = (v: number, declarations: boolean) => (declarations ? String(v) : "Bela");

// no second bela in a hand (twenties: how many 20s both teams have now)
export const zvanjeBlocked = (declarations: boolean, twenties: number) => !declarations && twenties >= 1;
