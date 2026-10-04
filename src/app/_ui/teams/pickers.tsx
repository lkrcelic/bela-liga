"use client";

import {searchPlayersAPI} from "@/app/_fetchers/player/search";
import {searchTeamsAPI} from "@/app/_fetchers/team/searchTeams";
import {IconTile, InitialsAvatar, PickerOption, SearchPicker} from "@/app/_ui/sp";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {SxProps, Theme} from "@mui/material";

export type PlayerOption = PickerOption;
export type TeamOption = PickerOption & {players: string[]};

export async function searchPlayers(q: string): Promise<PlayerOption[]> {
  const found = await searchPlayersAPI(q);
  return (Array.isArray(found) ? found : []).map((p) => ({id: p.id, title: p.username, subtitle: `${p.first_name} ${p.last_name}`.trim()}));
}

export async function searchTeams(q: string): Promise<TeamOption[]> {
  const found = await searchTeamsAPI(q);
  return found.map((t) => {
    const players = (t.teamPlayers ?? []).map((tp) => tp.player.username);
    return {id: t.team_id, title: t.team_name, subtitle: players.join(" · ") || undefined, players};
  });
}

type Common<T> = {label: string; placeholder: string; value: T | null; onChange: (v: T | null) => void; exclude?: number[]; soft?: boolean; sx?: SxProps<Theme>};

export function PlayerPicker(props: Common<PlayerOption>) {
  return <SearchPicker {...props} search={searchPlayers} renderIcon={(o) => <InitialsAvatar name={o.subtitle || o.title} size={36} />} />;
}

export function TeamPicker(props: Common<TeamOption>) {
  return (
    <SearchPicker
      {...props}
      search={searchTeams}
      renderIcon={() => (
        <IconTile size={36} radius={12}>
          <GroupsRoundedIcon />
        </IconTile>
      )}
    />
  );
}
