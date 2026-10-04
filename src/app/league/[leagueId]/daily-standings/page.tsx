"use client";

import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useLeagues from "@/app/_hooks/useLeagues";
import useMyTeams from "@/app/_hooks/useMyTeams";
import {useDailyData, useRoundDates} from "@/app/_hooks/useStandings";
import {leagueDateString} from "@/app/_lib/dates";
import {splitPodium, toStandingsRows} from "@/app/_lib/ui/standings";
import {filterTables, liveCount, splitColumns, TableFilter, tableColumns, toTableRows} from "@/app/_lib/ui/tables";
import {displayDate, plural} from "@/app/_lib/ui/text";
import {color, font} from "@/app/_styles/tokens";
import {
  Card,
  DesktopShell,
  Display,
  EmptyState,
  ErrorNote,
  IconCircleButton,
  LeagueEyebrowButton,
  LeagueMenuButton,
  LoadingRows,
  PillTabs,
  Podium,
  PrimaryButton,
  Screen,
  ScrollArea,
  ScrollCard,
  SearchInput,
  Segmented,
  StandingsGrid,
  StandingsRows,
  tabPanelProps,
} from "@/app/_ui/sp";
import {DesktopTableRow, PhoneRoundTables} from "@/app/league/[leagueId]/daily-standings/ui/RoundTables";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import {Box} from "@mui/material";
import {useParams, useSearchParams} from "next/navigation";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useEffect, useMemo, useState} from "react";

export default function DailyStandings() {
  const params = useParams<{leagueId: string}>();
  const leagueId = Number(params.leagueId);
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const leagues = useLeagues(leagueId);
  const {teams} = useMyTeams();
  const myTeamNames = useMemo(() => teams.map((t) => t.team_name), [teams]);

  // the night shown: ?date= when it is one the league played, otherwise the latest one
  const {dates, error: datesError} = useRoundDates(leagueId);
  const dateParam = searchParams.get("date");
  const date = dates == null ? null : dateParam && dates.includes(dateParam) ? dateParam : dates[dates.length - 1] ?? "";
  const index = date && dates ? dates.indexOf(date) : -1;
  const prevDate = index > 0 ? dates[index - 1] : null;
  const nextDate = dates && index >= 0 && index < dates.length - 1 ? dates[index + 1] : null;
  const goDate = (d: string | null) => d && router.router.replace(`/league/${leagueId}/daily-standings?date=${d}`);

  const daily = useDailyData(leagueId, date || null);
  const today = leagueDateString();
  const isToday = date === today;

  const standings = useMemo(() => toStandingsRows(daily.data?.standings, myTeamNames), [daily.data, myTeamNames]);
  const roundNumbers = daily.data?.roundNumbers ?? [];
  const roundsLive = (n: number) => (daily.data?.rounds ?? []).some((r) => r.round_number === n && r.active);

  // tab 0 is the night's table, then one tab per round; the desktop opens on the round being played
  const [tab, setTab] = useState(0);
  const [tabTouched, setTabTouched] = useState(false);
  useEffect(() => {
    setTab(0);
    setTabTouched(false);
  }, [date, leagueId]);
  useEffect(() => {
    if (!isDesktop || tabTouched || !daily.data) return;
    const live = [...roundNumbers].reverse().find((n) => roundsLive(n));
    if (live) setTab(live);
  }, [isDesktop, tabTouched, daily.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickTab = (k: number) => {
    setTab(k);
    setTabTouched(true);
  };
  const tabs = [{key: 0, label: "Tablica okupljanja"}, ...roundNumbers.map((n) => ({key: n, label: `Round ${n}`, live: roundsLive(n)}))];
  const roundRows = useMemo(
    () => toTableRows((daily.data?.rounds ?? []).filter((r) => r.round_number === tab), myTeamNames),
    [daily.data, tab, myTeamNames]
  );

  const changeLeague = (id: number) => router.router.push(`/league/${id}/daily-standings`);
  const dateTitle = date ? displayDate(date) : "—";
  const noNights = dates != null && dates.length === 0;
  const loadError = datesError ?? daily.error;

  const arrows = (
    <Box sx={{display: "flex", gap: "8px", flex: "none"}}>
      <IconCircleButton label="Prethodni datum" onClick={() => goDate(prevDate)} disabled={!prevDate}>
        <ChevronLeftRoundedIcon />
      </IconCircleButton>
      <IconCircleButton label="Sljedeći datum" onClick={() => goDate(nextDate)} disabled={!nextDate}>
        <ChevronRightRoundedIcon />
      </IconCircleButton>
    </Box>
  );

  if (isDesktop) {
    return (
      <DesktopShell
        active="daily"
        eyebrow={isToday ? "Okupljanje · večeras" : "Okupljanje"}
        title={dateTitle}
        right={
          <>
            <LeagueMenuButton leagues={leagues} value={leagueId} onChange={changeLeague} />
            {tabs.length > 1 && <Segmented items={tabs} value={tab} onChange={pickTab} label="Prikaz" idPrefix="daily" />}
            {arrows}
          </>
        }
      >
        <Box {...tabPanelProps("daily", tab)} sx={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "20px"}}>
          {loadError ? (
            <ErrorNote onRetry={daily.reload}>{loadError}</ErrorNote>
          ) : noNights ? (
            <Card>
              <EmptyState>Ova liga još nema odigranih okupljanja.</EmptyState>
            </Card>
          ) : daily.loading && !daily.data ? (
            <Card sx={{flex: 1, overflow: "hidden"}}>
              <LoadingRows rows={10} height={56} />
            </Card>
          ) : tab === 0 ? (
            <DesktopNightTable rows={standings} date={dateTitle} />
          ) : (
            <DesktopRound title={`Round ${tab}`} rows={roundRows} />
          )}
        </Box>
      </DesktopShell>
    );
  }

  const {podium, rest} = splitPodium(standings);
  const showPodium = !isToday && podium.length > 0;

  return (
    <Screen fill>
      <Box component="header" sx={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", px: "4px"}}>
        <Box sx={{display: "flex", flexDirection: "column", gap: "6px", minWidth: 0}}>
          <LeagueEyebrowButton leagues={leagues} value={leagueId} onChange={changeLeague} />
          <Display size={36} sx={{lineHeight: 1, fontVariantNumeric: "tabular-nums"}}>
            {dateTitle}
          </Display>
        </Box>
        {arrows}
      </Box>
      {tabs.length > 1 && <PillTabs items={tabs} value={tab} onChange={pickTab} label="Prikaz" idPrefix="daily" />}

      <Box {...tabPanelProps("daily", tab)} sx={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "14px"}}>
        {loadError ? (
          <ErrorNote onRetry={daily.reload}>{loadError}</ErrorNote>
        ) : noNights ? (
          <Card>
            <EmptyState>Ova liga još nema odigranih okupljanja.</EmptyState>
          </Card>
        ) : daily.loading && !daily.data ? (
          <ScrollCard>
            <LoadingRows rows={8} />
          </ScrollCard>
        ) : tab === 0 ? (
          <>
            {showPodium && <Podium rows={podium} compact />}
            <ScrollCard aria-label={`Poredak okupljanja ${dateTitle}`}>
              {standings.length === 0 ? <EmptyState>Nema rezultata za ovaj datum.</EmptyState> : <StandingsRows rows={showPodium ? rest : standings} />}
            </ScrollCard>
          </>
        ) : (
          <ScrollArea bleed sx={{gap: "10px"}}>
            <PhoneRoundTables title={`Round ${tab}`} rows={roundRows} />
          </ScrollArea>
        )}
      </Box>

      <PrimaryButton icon={<HomeRoundedIcon />} onClick={() => router.push("/", "back")}>
        Početni zaslon
      </PrimaryButton>
    </Screen>
  );
}

// Desktop "Tablica okupljanja": podium and the full table with real columns
function DesktopNightTable({rows, date}: {rows: ReturnType<typeof toStandingsRows>; date: string}) {
  const {podium, rest} = splitPodium(rows);
  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState>Nema rezultata za ovaj datum.</EmptyState>
      </Card>
    );
  }
  return (
    <>
      <Podium rows={podium} />
      <Card sx={{flex: 1, minHeight: 0, overflowY: "auto", scrollbarGutter: "stable", borderRadius: "22px", alignSelf: "stretch"}}>
        <StandingsGrid rows={podium.length ? rest : rows} caption={`Poredak okupljanja ${date}`} sx={{"& tr[role=row]": {px: "18px"}}} />
      </Card>
    </>
  );
}

// Desktop round view: every table at once, in 1–3 columns, with status filters and a search
function DesktopRound({title, rows}: {title: string; rows: ReturnType<typeof toTableRows>}) {
  const [filter, setFilter] = useState<TableFilter>("all");
  const [query, setQuery] = useState("");
  const visible = filterTables(rows, filter, query);
  const cols = tableColumns(rows.length);
  const columns = splitColumns(visible, cols);
  const live = liveCount(rows);
  const filters = [
    {key: "all" as TableFilter, label: "Svi", count: rows.length},
    {key: "live" as TableFilter, label: "Uživo", count: live},
    {key: "done" as TableFilter, label: "Gotovo", count: rows.filter((r) => r.done).length},
  ];
  return (
    <Box sx={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "12px"}}>
      <Box sx={{flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px"}}>
        <Box sx={{display: "flex", alignItems: "baseline", gap: "14px"}}>
          <Box component="h2" sx={{m: 0, fontFamily: font.display, fontSize: 26, fontWeight: 800}}>
            {title}
          </Box>
          <Box sx={{fontSize: 16, color: color.inkSoft, fontVariantNumeric: "tabular-nums"}}>
            {rows.length} {plural(rows.length, "stol", "stola", "stolova")} · {live} uživo
          </Box>
        </Box>
        <Box sx={{display: "flex", alignItems: "center", gap: "10px"}}>
          <SearchInput
            soft
            height={44}
            placeholder="Ekipa ili broj stola"
            aria-label="Traži ekipu ili broj stola"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{width: 260}}
          />
          <Segmented<TableFilter>
            items={filters}
            value={filter}
            onChange={setFilter}
            label="Filtriraj stolove"
            size={38}
            asTabs={false}
          />
        </Box>
      </Box>
      {visible.length === 0 ? (
        <Card>
          <EmptyState>Nema stolova za ovaj filter.</EmptyState>
        </Card>
      ) : (
        <Box sx={{flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: "16px", alignItems: "start"}}>
          {columns.map((col, i) =>
            col.length ? (
              <Card key={i} component="ul" sx={{listStyle: "none", m: 0, p: 0, maxHeight: "100%", overflowY: "auto", scrollbarGutter: "stable"}}>
                {col.map((t) => (
                  <DesktopTableRow key={t.id} t={t} dense={cols >= 3} />
                ))}
              </Card>
            ) : (
              <Box key={i} />
            )
          )}
        </Box>
      )}
    </Box>
  );
}
