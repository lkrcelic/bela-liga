// Liga na dvije lokacije (LOCATIONS_PLAN.md): a league night can be played at two places at once. A team plays at
// slot 1 (the night's first place) or slot 2 (its second); Podjela puts it there. These are the rules that need no
// database, so they can be unit tested.

// The place of a two-place night a team or a table is at
export type Slot = 1 | 2;
export const SLOTS: readonly Slot[] = [1, 2];

export function isSlot(value: unknown): value is Slot {
  return value === 1 || value === 2;
}

// A place from a query string (?slot=1 or 2); anything else is none (a one-place night)
export function slotParam(value: string | null | undefined): Slot | null {
  const n = Number(value);
  return isSlot(n) ? n : null;
}

// "?slot=2" for a request about one place of a two-place night; "" on a one-place night (with: "&" after a query)
export function slotQuery(slot: Slot | null | undefined, joiner: "?" | "&" = "?"): string {
  return slot == null ? "" : `${joiner}slot=${slot}`;
}

// The other place of the night
export function otherSlot(slot: Slot): Slot {
  return slot === 1 ? 2 : 1;
}

// A night is played at two places when it has a second one
export function isTwoPlaceNight(night: {second_location_id: number | null | undefined}): boolean {
  return night.second_location_id != null;
}

// Podjela's columns and Kopiraj raspored list a place's teams alphabetically, as Croatian sorts them (Č after C, Š
// after S)
export function byTeamName<T extends {name: string}>(a: T, b: T): number {
  return a.name.localeCompare(b.name, "hr", {sensitivity: "base"}) || a.name.localeCompare(b.name, "hr");
}

// "Zamijeni lokacije": every assigned team goes to the other place; unassigned teams stay unassigned
export function swapSlots(assigned: ReadonlyMap<number, Slot>): Map<number, Slot> {
  return new Map(Array.from(assigned, ([teamId, slot]) => [teamId, otherSlot(slot)]));
}

// "Kopiraj raspored": plain text for a message. Each place's name, then its teams one per line ("• Ime"),
// alphabetically, and a blank line before the next place. Unassigned teams aren't copied.
export function copyText(places: readonly {name: string; teams: readonly string[]}[]): string {
  return places
    .map((p) => [p.name, ...[...p.teams].map((name) => ({name})).sort(byTeamName).map((t) => `• ${t.name}`)].join("\n"))
    .join("\n\n");
}
