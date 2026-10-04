"use client";

import {createMultipleRoundsAPI} from "@/app/_fetchers/round/createMultipleRounds";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useLeagues, {LeagueOption} from "@/app/_hooks/useLeagues";
import useLeagueTeams, {LeagueTeam} from "@/app/_hooks/useLeagueTeams";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {matchesQuery, plural} from "@/app/_lib/ui/text";
import {color, shadow} from "@/app/_styles/tokens";
import {
  buttonBase,
  Card,
  DesktopShell,
  EmptyState,
  ErrorNote,
  IconCircleButton,
  IconTile,
  LoadingRows,
  PrimaryButton,
  Screen,
  ScreenTitle,
  ScrollCard,
  SearchInput,
  SectionLabel,
  Stepper,
  SwitchRow,
  SwitchTrack,
} from "@/app/_ui/sp";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import {Box} from "@mui/material";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useEffect, useMemo, useState} from "react";

const MAX_ROUNDS = 5;
const MAX_WINDOW = 200;

export default function CreateRound() {
  const router = useTransitionRouter();
  const isDesktop = useIsDesktop();
  const leagues = useLeagues();
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [rounds, setRounds] = useState(4);
  const [windowSize, setWindowSize] = useState(8);
  const [query, setQuery] = useState("");
  // teams switched away from their default (active teams start on, inactive teams start off)
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // the desktop shows the league list and the teams together, so it starts on the current league
  const activeLeague = leagueId ?? (isDesktop ? leagues.find((l) => l.id === CURRENT_LEAGUE_ID)?.id ?? leagues[0]?.id ?? null : null);
  const {teams, error: teamsError, loading, reload} = useLeagueTeams(activeLeague);
  const inactive = useMemo(() => new Set((teams ?? []).filter((t) => !t.active).map((t) => t.id)), [teams]);
  const defaultRounds = leagues.find((l) => l.id === activeLeague)?.roundsPerNight;

  // every active team starts as present, and Rounds starts at the league's rounds per night; switching league starts over
  useEffect(() => {
    setFlipped(new Set());
    setQuery("");
    setCreateError(null);
    if (defaultRounds) setRounds(Math.min(MAX_ROUNDS, defaultRounds));
  }, [activeLeague, defaultRounds]);

  // an inactive team (one that stopped coming) can still be switched on for tonight
  const onByDefault = (id: number) => !inactive.has(id);
  const isOn = (t: LeagueTeam) => onByDefault(t.id) !== flipped.has(t.id);
  const visible = useMemo(() => (teams ?? []).filter((t) => matchesQuery(t.name, query)), [teams, query]);
  const allOn = visible.length > 0 && visible.every(isOn);
  const selected = (teams ?? []).filter(isOn);
  const count = selected.length;

  const toggle = (id: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setFlipped((prev) => {
      const next = new Set(prev);
      visible.forEach((t) => (!allOn === onByDefault(t.id) ? next.delete(t.id) : next.add(t.id)));
      return next;
    });

  const create = async () => {
    if (activeLeague == null || count < 2 || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const roundNumber = await createMultipleRoundsAPI(activeLeague, selected.map((t) => t.id), rounds, windowSize);
      // replace, so the back button doesn't lead to this form again
      router.replace(`/round/pairings/${roundNumber}?league=${activeLeague}`);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Kolo nije moguće napraviti.");
      setCreating(false);
    }
  };

  const steppers = (
    <Box sx={{display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "10px"}}>
      <Stepper
        label="Rounds"
        value={rounds}
        onInc={() => setRounds((r) => Math.min(MAX_ROUNDS, r + 1))}
        onDec={() => setRounds((r) => Math.max(1, r - 1))}
        canInc={rounds < MAX_ROUNDS}
        canDec={rounds > 1}
      />
      {/* the pairing needs an even window */}
      <Stepper
        label="Window"
        value={windowSize}
        onInc={() => setWindowSize((w) => Math.min(MAX_WINDOW, w + 2))}
        onDec={() => setWindowSize((w) => Math.max(2, w - 2))}
        canInc={windowSize < MAX_WINDOW}
        canDec={windowSize > 2}
      />
    </Box>
  );

  const createButton = (
    <PrimaryButton onClick={create} disabled={count < 2} loading={creating}>
      {creating ? "Stvaram kolo…" : `Create round · ${count} ${plural(count, "team", "teams", "teams")}`}
    </PrimaryButton>
  );

  const teamState = teamsError ? (
    <ErrorNote onRetry={reload} sx={{m: "12px"}}>
      {teamsError}
    </ErrorNote>
  ) : loading ? (
    <LoadingRows rows={8} height={56} />
  ) : visible.length === 0 ? (
    <EmptyState>{teams?.length ? "Nijedna ekipa ne odgovara pretrazi." : "Ova liga još nema ekipa."}</EmptyState>
  ) : null;

  const inactiveBadge = (
    <Box
      component="span"
      sx={{height: 22, px: "8px", borderRadius: "11px", background: color.paper, color: color.muted, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", flex: "none"}}
    >
      Inactive
    </Box>
  );

  if (isDesktop) {
    return (
      <DesktopShell active="createRound" eyebrow="Admin" title="Create Round">
        <Box sx={{flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: "20px"}}>
          <Box sx={{display: "flex", flexDirection: "column", gap: "16px", minHeight: 0}}>
            <Box component="section" aria-labelledby="cr-league" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
              <SectionLabel id="cr-league">League</SectionLabel>
              <Box role="radiogroup" aria-labelledby="cr-league" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
                {leagues.map((l) => (
                  <LeagueOptionButton key={l.id} league={l} selected={l.id === activeLeague} onClick={() => setLeagueId(l.id)} />
                ))}
              </Box>
            </Box>
            <Box component="section" aria-labelledby="cr-options" sx={{display: "flex", flexDirection: "column", gap: "8px"}}>
              <SectionLabel id="cr-options">Options</SectionLabel>
              {steppers}
            </Box>
            <Box sx={{mt: "auto", display: "flex", flexDirection: "column", gap: "10px"}}>
              {createError && <ErrorNote>{createError}</ErrorNote>}
              {createButton}
            </Box>
          </Box>
          <Card component="section" aria-label="Prisutne ekipe" sx={{minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "24px"}}>
            <Box sx={{display: "flex", alignItems: "center", gap: "12px", p: "14px", borderBottom: `1px solid rgba(60,74,103,.1)`}}>
              <SearchInput soft height={48} placeholder="Search" aria-label="Traži ekipu" value={query} onChange={(e) => setQuery(e.target.value)} sx={{flex: 1}} />
              <Box
                component="button"
                type="button"
                role="switch"
                aria-checked={allOn}
                onClick={toggleAll}
                disabled={visible.length === 0}
                sx={{...buttonBase, height: 48, display: "flex", alignItems: "center", gap: "12px", pl: "14px", pr: "8px", borderRadius: "14px", background: color.tableHead, fontSize: 15, fontWeight: 700, color: color.ink}}
              >
                <span>{query ? "Select all filtered" : "Select all"}</span>
                <SwitchTrack on={allOn} />
              </Box>
            </Box>
            {teamState ?? (
              <Box sx={{flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gridAutoRows: "56px", columnGap: "24px", p: "4px 14px"}}>
                {visible.map((t) => (
                  <SwitchRow key={t.id} checked={isOn(t)} onChange={() => toggle(t.id)} sx={{px: "4px", minHeight: 56}}>
                    <Box component="span" sx={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                      {t.name}
                    </Box>
                    {inactive.has(t.id) && inactiveBadge}
                  </SwitchRow>
                ))}
              </Box>
            )}
          </Card>
        </Box>
      </DesktopShell>
    );
  }

  // phone, step 1: pick the league
  if (activeLeague == null) {
    return (
      <Screen>
        <Box>
          <IconCircleButton label="Nazad" onClick={() => router.push("/", "back")}>
            <ArrowBackRoundedIcon />
          </IconCircleButton>
        </Box>
        <ScreenTitle eyebrow="Admin · Create Round" title="Select league" sx={{pt: "4px", pb: "8px"}} />
        <Box role="list" sx={{display: "flex", flexDirection: "column", gap: "10px"}}>
          {leagues.map((l) => (
            <Box
              key={l.id}
              role="listitem"
              component="button"
              type="button"
              onClick={() => setLeagueId(l.id)}
              sx={{
                ...buttonBase,
                minHeight: 76,
                borderRadius: "22px",
                background: color.card,
                display: "flex",
                alignItems: "center",
                gap: "14px",
                px: "16px",
                textAlign: "left",
                boxShadow: shadow.card,
                "&:active": {transform: "scale(.98)"},
              }}
            >
              <IconTile>
                <EmojiEventsRoundedIcon />
              </IconTile>
              <Box component="span" sx={{flex: 1, display: "flex", flexDirection: "column", gap: "2px", minWidth: 0}}>
                <Box component="span" sx={{fontSize: 17, fontWeight: 600, color: color.ink}}>
                  {l.name}
                </Box>
                {l.meta && (
                  <Box component="span" sx={{fontSize: 14, color: color.muted}}>
                    {l.meta}
                  </Box>
                )}
              </Box>
              <ChevronRightRoundedIcon sx={{fontSize: 24, color: color.muted}} />
            </Box>
          ))}
        </Box>
      </Screen>
    );
  }

  // phone, step 2: options and the teams present tonight
  const leagueName = leagues.find((l) => l.id === activeLeague)?.name ?? "";
  return (
    <Screen fill gap={12}>
      <Box sx={{display: "flex", alignItems: "flex-start", gap: "12px"}}>
        <IconCircleButton label="Promijeni ligu" onClick={() => setLeagueId(null)}>
          <ArrowBackRoundedIcon />
        </IconCircleButton>
        <ScreenTitle eyebrow={`Admin · ${leagueName}`} title="Create Round" sx={{minWidth: 0, "& > div:first-of-type": {overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}} />
      </Box>
      {steppers}
      <SearchInput placeholder="Search" aria-label="Traži ekipu" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ScrollCard aria-label="Prisutne ekipe">
        {teamState ?? (
          <>
            <SwitchRow
              checked={allOn}
              onChange={toggleAll}
              disabled={visible.length === 0}
              sx={{background: color.paperSoft, fontWeight: 700, color: color.ink, borderBottom: `1px solid rgba(60,74,103,.12)`}}
            >
              {query ? "Select all filtered" : "Select all"}
            </SwitchRow>
            {visible.map((t) => (
              <SwitchRow key={t.id} checked={isOn(t)} onChange={() => toggle(t.id)}>
                <Box component="span" sx={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                  {t.name}
                </Box>
                {inactive.has(t.id) && inactiveBadge}
              </SwitchRow>
            ))}
          </>
        )}
      </ScrollCard>
      {createError && <ErrorNote>{createError}</ErrorNote>}
      {createButton}
    </Screen>
  );
}

function LeagueOptionButton({league, selected, onClick}: {league: LeagueOption; selected: boolean; onClick: () => void}) {
  return (
    <Box
      component="button"
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      sx={{
        ...buttonBase,
        minHeight: 68,
        borderRadius: "18px",
        border: `2px solid ${selected ? color.navy : "transparent"}`,
        background: color.card,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        px: "14px",
        textAlign: "left",
      }}
    >
      <IconTile size={40} radius={12}>
        <EmojiEventsRoundedIcon />
      </IconTile>
      <Box component="span" sx={{flex: 1, display: "flex", flexDirection: "column", minWidth: 0}}>
        <Box component="span" sx={{fontSize: 16, fontWeight: 600, color: color.ink}}>
          {league.name}
        </Box>
        {league.meta && (
          <Box component="span" sx={{fontSize: 13, color: color.muted}}>
            {league.meta}
          </Box>
        )}
      </Box>
      {selected && <CheckCircleRoundedIcon sx={{fontSize: 24, color: color.navy}} />}
    </Box>
  );
}
