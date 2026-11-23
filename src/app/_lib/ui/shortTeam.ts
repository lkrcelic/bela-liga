// A league team that can't field two players (#41): its other players were deactivated, deleted or taken off the team.
// Novo kolo and Upravljanje ligom · Ekipe mark it before the night, and Tko igra says so above Potvrdi, so the admin
// doesn't find out at the table. The team can still be seated and its lineup confirmed: the warning only tells.

import {PLAYERS_PER_TEAM} from "@/app/_lib/lineup";

// The chip on the team in Novo kolo's list (null: it has its two players, or the count isn't known)
export function shortTeamChip(activePlayers: number | undefined): string | null {
  if (activePlayers == null || activePlayers >= PLAYERS_PER_TEAM) return null;
  return activePlayers === 0 ? "Bez igrača" : `${activePlayers} igrač`;
}

// The chip beside a team in Novo kolo with the one-player warning added (TeamChip's shape): a ban stays as it is (the
// team can't play anyway); a team with no other chip gets the warning alone; an arrival chip ("Tu · 19:42",
// "Nije potvrdila") or Neaktivna keeps its word and gets the warning beside it, in red, so neither hides the other.
export function withShortTeam<C extends {label: string; tone: "green" | "muted" | "red"; title?: string}>(
  chip: C | null,
  activePlayers: number | undefined,
  banned: boolean
): C | {label: string; tone: "red"; title: string} | null {
  const short = shortTeamChip(activePlayers);
  if (!short || banned) return chip;
  const text = `${shortTeamText(activePlayers)} · dodaj igrača na stranici ekipe`;
  if (!chip) return {label: short, tone: "red", title: text};
  return {...chip, label: `${chip.label} · ${short}`, tone: "red", title: chip.title ? `${chip.title} · ${text}` : text};
}

// The line under the team in Upravljanje ligom · Ekipe and the chip's title
export function shortTeamText(activePlayers: number | undefined): string | null {
  if (activePlayers == null || activePlayers >= PLAYERS_PER_TEAM) return null;
  return activePlayers === 0 ? "Ekipa nema aktivnih igrača" : `Ekipa ima samo ${activePlayers} aktivnog igrača`;
}

// Tko igra of a round still to be played: a line per team with fewer than two players to pick from (members are the
// players it can be picked from). A finished round's lineup is who played it, so it says nothing there.
export function shortLineupNotes(teams: {name: string; members: unknown[]}[], finished: boolean): string[] {
  if (finished) return [];
  return teams
    .filter((t) => t.members.length < PLAYERS_PER_TEAM)
    .map((t) =>
      t.members.length === 0
        ? `${t.name} nema nijednog igrača s računom: dodaj igrača u ekipu.`
        : `${t.name} ima samo jednog igrača s računom: dodaj igrača u ekipu ili potvrdi svejedno.`
    );
}
