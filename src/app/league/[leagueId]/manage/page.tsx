"use client";

import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useLeagues from "@/app/_hooks/useLeagues";
import useLeagueTeams from "@/app/_hooks/useLeagueTeams";
import {useLeagueStandings} from "@/app/_hooks/useStandings";
import {matchesQuery} from "@/app/_lib/ui/text";
import {addTeamToLeagueAPI, setLeagueTeamActiveAPI} from "@/app/_fetchers/league/leagues";
import {color, font} from "@/app/_styles/tokens";
import {
  buttonBase,
  Card,
  DesktopShell,
  ellipsis,
  EmptyState,
  ErrorNote,
  IconCircleButton,
  InfoNote,
  LeagueEyebrowButton,
  LeagueMenuButton,
  LoadingRows,
  OutlineButton,
  PlayerChip,
  Screen,
  ScreenTitle,
  SearchInput,
  Segmented,
  Spinner,
  SwitchTrack,
} from "@/app/_ui/sp";
import {searchTeams, TeamOption} from "@/app/_ui/teams/pickers";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import {Box} from "@mui/material";
import {useParams} from "next/navigation";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useEffect, useMemo, useState} from "react";

type Filter = "all" | "active" | "inactive";
type Row = {id: number; name: string; players: string[]; played: number | null; active: boolean};

export default function ManageLeague() {
  const params = useParams<{leagueId: string}>();
  const leagueId = Number(params.leagueId);
  const router = useTransitionRouter();
  const isDesktop = useIsDesktop();
  const leagues = useLeagues(leagueId);
  const {teams, setTeams, error, loading, reload} = useLeagueTeams(leagueId);
  const {standings} = useLeagueStandings(leagueId);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const played = useMemo(() => new Map((standings ?? []).map((s) => [Number(s.team_id), s.rounds_played])), [standings]);
  const rows: Row[] = useMemo(() => {
    const list = (teams ?? []).map((t) => ({...t, played: played.get(t.id) ?? null}));
    // a team added just now is listed first
    return justAdded == null ? list : [...list.filter((t) => t.id === justAdded), ...list.filter((t) => t.id !== justAdded)];
  }, [teams, played, justAdded]);

  const visible = rows.filter(
    (r) => (filter === "all" || (filter === "active") === r.active) && matchesQuery(`${r.name} ${r.players.join(" ")}`, query)
  );
  const filters = [
    {key: "all" as Filter, label: "All", count: rows.length},
    {key: "active" as Filter, label: "Active", count: rows.filter((r) => r.active).length},
    {key: "inactive" as Filter, label: "Inactive", count: rows.filter((r) => !r.active).length},
  ];
  const leagueName = leagues.find((l) => l.id === leagueId)?.name ?? "";

  // optimistic: the switch moves at once and goes back if the server refuses
  const setActive = async (r: Row, active: boolean) => {
    setActionError(null);
    setTeams((prev) => prev?.map((t) => (t.id === r.id ? {...t, active} : t)) ?? prev);
    try {
      await setLeagueTeamActiveAPI(leagueId, r.id, active);
    } catch (e) {
      setTeams((prev) => prev?.map((t) => (t.id === r.id ? {...t, active: !active} : t)) ?? prev);
      setActionError(e instanceof Error ? e.message : "Status ekipe nije spremljen.");
    }
  };

  const onAdd = async (t: TeamOption) => {
    setActionError(null);
    try {
      await addTeamToLeagueAPI(leagueId, t.id);
      setTeams((prev) => [...(prev ?? []), {id: t.id, name: t.title, players: t.players, active: true}]);
      setJustAdded(t.id);
      if (filter === "inactive") setFilter("all");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ekipu nije moguće dodati.");
      throw e;
    }
  };

  const listState = error ? (
    <ErrorNote onRetry={reload} sx={{m: "14px"}}>
      {error}
    </ErrorNote>
  ) : loading ? (
    <LoadingRows rows={8} height={60} />
  ) : visible.length === 0 ? (
    <EmptyState>{rows.length ? "Nijedna ekipa ne odgovara filteru." : "Ova liga još nema ekipa."}</EmptyState>
  ) : null;

  const toolbar = (
    <Box sx={{flex: "none", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", p: "14px", borderBottom: `1px solid rgba(60,74,103,.1)`}}>
      <Segmented<Filter> items={filters} value={filter} onChange={setFilter} label="Status ekipa" variant="soft" asTabs={false} />
      <SearchInput
        soft
        height={46}
        placeholder="Search teams or players"
        aria-label="Traži ekipe ili igrače"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{flex: 1, minWidth: 200}}
      />
    </Box>
  );

  const statusToggle = (r: Row) => (
    <Box
      component="button"
      type="button"
      role="switch"
      aria-checked={r.active}
      aria-label={`${r.name}: ${r.active ? "aktivna" : "neaktivna"}`}
      onClick={() => setActive(r, !r.active)}
      sx={{
        ...buttonBase,
        justifySelf: "end",
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        pl: "10px",
        pr: "4px",
        borderRadius: "12px",
        fontSize: 14,
        fontWeight: 600,
        color: r.active ? color.green : color.faint,
        "&:hover": {background: color.paper},
      }}
    >
      {r.active ? "Active" : "Inactive"}
      <SwitchTrack on={r.active} onColor={color.green} />
    </Box>
  );

  const sidePanel = (
    <Box sx={{minHeight: 0, display: "flex", flexDirection: "column", gap: "16px"}}>
      <AddTeamCard exclude={rows.map((r) => r.id)} onAdd={onAdd} onCreate={() => router.push("/teams/new")} />
      <InfoNote icon={<InfoRoundedIcon />}>
        Inactive teams stay in the league and its standings, but are not signed in automatically when you create a round.
      </InfoNote>
    </Box>
  );

  if (isDesktop) {
    return (
      <DesktopShell
        active="manageLeague"
        eyebrow="Admin"
        title="Manage League"
        right={<LeagueMenuButton leagues={leagues} value={leagueId} onChange={(id) => router.router.push(`/league/${id}/manage`)} />}
      >
        <Box sx={{flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: "20px"}}>
          <Card component="section" aria-label={`Ekipe lige ${leagueName}`} sx={{minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "24px"}}>
            {toolbar}
            {actionError && <ErrorNote sx={{m: "12px 14px 0"}}>{actionError}</ErrorNote>}
            <Box
              aria-hidden
              sx={{flex: "none", height: 40, display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1.4fr) 80px 170px", gap: "12px", alignItems: "center", px: "20px", background: color.tableHead, borderBottom: `1px solid rgba(60,74,103,.1)`, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: color.muted}}
            >
              <span>Team</span>
              <span>Players</span>
              <Box component="span" sx={{textAlign: "center"}}>
                Played
              </Box>
              <Box component="span" sx={{textAlign: "right"}}>
                Status
              </Box>
            </Box>
            {listState ?? (
              <Box component="ul" sx={{listStyle: "none", m: 0, p: 0, flex: 1, minHeight: 0, overflowY: "auto", scrollbarGutter: "stable"}}>
                {visible.map((r) => (
                  <Box
                    component="li"
                    key={r.id}
                    sx={{
                      minHeight: 60,
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1.4fr) 80px 170px",
                      gap: "12px",
                      alignItems: "center",
                      px: "20px",
                      borderBottom: `1px solid rgba(60,74,103,.07)`,
                      background: r.id === justAdded ? color.creamSoft : "transparent",
                      animation: r.id === justAdded ? "spRowIn 420ms cubic-bezier(.2,.8,.2,1) both" : "none",
                    }}
                  >
                    <Box component="span" sx={{fontSize: 16, fontWeight: 600, color: r.active ? color.ink : color.faint, ...ellipsis}}>
                      {r.name}
                    </Box>
                    <Box component="span" sx={{display: "flex", gap: "6px", minWidth: 0, overflow: "hidden", opacity: r.active ? 1 : 0.55}}>
                      {r.players.map((p) => (
                        <PlayerChip key={p} name={p} size="sm" />
                      ))}
                    </Box>
                    <Box component="span" sx={{textAlign: "center", fontSize: 15, color: color.inkSoft, fontVariantNumeric: "tabular-nums"}}>
                      {r.played ?? "—"}
                    </Box>
                    {statusToggle(r)}
                  </Box>
                ))}
              </Box>
            )}
          </Card>
          {sidePanel}
        </Box>
      </DesktopShell>
    );
  }

  return (
    <Screen>
      <Box sx={{display: "flex", alignItems: "flex-start", gap: "12px"}}>
        <IconCircleButton label="Nazad" onClick={() => router.push("/", "back")}>
          <ArrowBackRoundedIcon />
        </IconCircleButton>
        <Box sx={{display: "flex", flexDirection: "column", gap: "6px", minWidth: 0, pt: "2px"}}>
          <LeagueEyebrowButton leagues={leagues} value={leagueId} onChange={(id) => router.router.push(`/league/${id}/manage`)} />
          <ScreenTitle title="Manage League" sx={{px: 0}} />
        </Box>
      </Box>
      <Card sx={{overflow: "hidden"}}>
        {toolbar}
        {actionError && <ErrorNote sx={{m: "12px 14px 0"}}>{actionError}</ErrorNote>}
        {listState ?? (
          <Box component="ul" sx={{listStyle: "none", m: 0, p: 0}}>
            {visible.map((r) => (
              <Box
                component="li"
                key={r.id}
                sx={{display: "flex", alignItems: "center", gap: "10px", p: "12px 10px 12px 16px", borderBottom: `1px solid ${color.line}`, background: r.id === justAdded ? color.creamSoft : "transparent"}}
              >
                <Box sx={{flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px"}}>
                  <Box component="span" sx={{fontSize: 16, fontWeight: 600, color: r.active ? color.ink : color.faint, ...ellipsis}}>
                    {r.name}
                  </Box>
                  <Box component="span" sx={{fontSize: 13, color: color.muted, ...ellipsis}}>
                    {r.players.join(" · ") || "—"}
                    {r.played != null && ` · ${r.played} OK`}
                  </Box>
                </Box>
                {statusToggle(r)}
              </Box>
            ))}
          </Box>
        )}
      </Card>
      {sidePanel}
    </Screen>
  );
}

// Search existing teams that are not in the league and add them
function AddTeamCard({exclude, onAdd, onCreate}: {exclude: number[]; onAdd: (t: TeamOption) => Promise<void>; onCreate: () => void}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const [hits, setHits] = useState<TeamOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      searchTeams(q)
        .then((found) => {
          if (!cancelled) setHits(found);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const shown = (hits ?? []).filter((h) => !exclude.includes(h.id)).slice(0, 4);

  return (
    <Card component="section" aria-labelledby="add-team" sx={{p: "20px", display: "flex", flexDirection: "column", gap: "12px", borderRadius: "24px"}}>
      <Box component="h2" id="add-team" sx={{m: 0, fontFamily: font.display, fontSize: 22, fontWeight: 800}}>
        Add team
      </Box>
      <SearchInput
        soft
        height={50}
        placeholder="Search existing teams"
        aria-label="Traži postojeće ekipe"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {hits != null && (
        <Box aria-live="polite" sx={{display: "flex", flexDirection: "column", border: `1px solid rgba(60,74,103,.1)`, borderRadius: "16px", overflow: "hidden"}}>
          {loading ? (
            <Box sx={{p: "16px 14px", display: "flex", gap: "10px", alignItems: "center", fontSize: 14, color: color.muted}}>
              <Spinner size={18} /> Tražim…
            </Box>
          ) : shown.length === 0 ? (
            <Box sx={{p: "18px 14px", fontSize: 14, color: color.muted}}>No teams found outside this league.</Box>
          ) : (
            shown.map((h) => (
              <Box key={h.id} sx={{minHeight: 58, display: "flex", alignItems: "center", gap: "10px", pl: "14px", pr: "8px", borderBottom: `1px solid rgba(60,74,103,.07)`}}>
                <Box sx={{flex: 1, minWidth: 0, display: "flex", flexDirection: "column"}}>
                  <Box component="span" sx={{fontSize: 15, fontWeight: 600, ...ellipsis}}>
                    {h.title}
                  </Box>
                  <Box component="span" sx={{fontSize: 13, color: color.muted, ...ellipsis}}>
                    {h.subtitle ?? "—"}
                  </Box>
                </Box>
                <IconCircleButton
                  label={`Dodaj ${h.title} u ligu`}
                  size={44}
                  disabled={adding != null}
                  onClick={async () => {
                    setAdding(h.id);
                    await onAdd(h).catch(() => undefined);
                    setAdding(null);
                  }}
                  sx={{borderRadius: "12px", background: color.navy, color: "#FFFFFF", boxShadow: "none", "& svg": {fontSize: 24}}}
                >
                  {adding === h.id ? <Spinner size={20} color="#FFFFFF" /> : <AddRoundedIcon />}
                </IconCircleButton>
              </Box>
            ))
          )}
        </Box>
      )}
      <OutlineButton onClick={onCreate} height={50} tone={color.navy} sx={{borderWidth: "1.5px", borderColor: "rgba(60,74,103,.25)", fontSize: 15}}>
        <GroupAddRoundedIcon sx={{fontSize: 22}} />
        Create new team
      </OutlineButton>
    </Card>
  );
}
