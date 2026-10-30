// Zabrana prijava: how long a ban lasts and how the screens write it. A ban runs until the day "until" (the first day
// the team or player may sign up again; null = Trajno). Framework free so it can be unit tested.

export type BanLength = "week" | "month" | "3months" | "year" | "forever" | "custom";
export type BanUnit = "days" | "weeks" | "months" | "years";

export const BAN_LENGTHS: {key: BanLength; label: string}[] = [
  {key: "week", label: "1 tjedan"},
  {key: "month", label: "1 mjesec"},
  {key: "3months", label: "3 mjeseca"},
  {key: "year", label: "1 godina"},
  {key: "forever", label: "Trajno"},
  {key: "custom", label: "Prilagođeno"},
];

export const BAN_UNITS: {key: BanUnit; label: string}[] = [
  {key: "days", label: "Dana"},
  {key: "weeks", label: "Tjedana"},
  {key: "months", label: "Mjeseci"},
  {key: "years", label: "Godina"},
];

const isoOf = (d: Date) => d.toISOString().slice(0, 10);

// today + n units (YYYY-MM-DD); a month from 31. 1. is the last day of February
export function addToDay(today: string, n: number, unit: BanUnit): string {
  const d = new Date(`${today}T00:00:00Z`);
  if (unit === "days") d.setUTCDate(d.getUTCDate() + n);
  else if (unit === "weeks") d.setUTCDate(d.getUTCDate() + 7 * n);
  else {
    const months = unit === "months" ? n : 12 * n;
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return isoOf(d);
}

// The day a ban chosen today ends; null for Trajno
export function banUntil(today: string, length: BanLength, custom?: {n: number; unit: BanUnit}): string | null {
  switch (length) {
    case "week":
      return addToDay(today, 1, "weeks");
    case "month":
      return addToDay(today, 1, "months");
    case "3months":
      return addToDay(today, 3, "months");
    case "year":
      return addToDay(today, 1, "years");
    case "forever":
      return null;
    case "custom":
      return addToDay(today, Math.max(1, custom?.n ?? 1), custom?.unit ?? "days");
  }
}

// A ban in force today: not lifted, and its day hasn't come
export function banActive(ban: {until: string | null; lifted: boolean}, today: string): boolean {
  return !ban.lifted && (ban.until == null || ban.until > today);
}

// "8. 11. 2026"
export function banDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${m}. ${y}`;
}

// "8. 11." (the tags beside a name)
export function banDayShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}. ${m}.`;
}

// The days left ("Još 10 dana"), at least 1
export function banDaysLeft(until: string, today: string): number {
  return Math.max(1, Math.round((Date.parse(`${until}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000));
}

// The line under the length picker: "Do 8. 11. 2026" or "Bez isteka · dok admin ne ukine"
export function untilLabel(until: string | null): string {
  return until ? `Do ${banDay(until)}` : "Bez isteka · dok admin ne ukine";
}
