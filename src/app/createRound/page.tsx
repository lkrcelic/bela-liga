"use client";

import {createMultipleRoundsAPI, RepeatMatchupsError} from "@/app/_fetchers/round/createMultipleRounds";
import useIsDesktop from "@/app/_hooks/useIsDesktop";
import useLeagues, {LeagueOption} from "@/app/_hooks/useLeagues";
import useLeagueTeams, {LeagueTeam} from "@/app/_hooks/useLeagueTeams";
import {matchesQuery, plural} from "@/app/_lib/ui/text";
import {color, font, shadow} from "@/app/_styles/tokens";
import {
  buttonBase,
  Card,
  DesktopShell,
  EmptyState,
  ErrorNote,
  IconCircleButton,
  IconTile,
  LoadingRows,
  OutlineButton,
  PrimaryButton,
  Screen,
  ScreenTitle,
  ScrollCard,
  SearchInput,
  SectionLabel,
  SolidButton,
  Stepper,
  SwitchRow,
  SwitchTrack,
} from "@/app/_ui/sp";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import {Box, Dialog} from "@mui/material";
import {useTransitionRouter} from "@/app/_lib/viewTransitions";
import {useEffect, useId, useMemo, useState} from "react";

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
  // the pairs that would meet twice today, while the admin decides whether to create the rounds anyway
  const [repeats, setRepeats] = useState<[string, string][] | null>(null);

  // the desktop shows the league list and the teams together, so it starts on the league being played now
  const activeLeague = leagueId ?? (isDesktop ? leagues.find((l) => l.active)?.id ?? leagues[0]?.id ?? null : null);
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

  const create = async ({window = windowSize, allowRepeats = false}: {window?: number; allowRepeats?: boolean} = {}) => {
    if (activeLeague == null || count < 2 || creating) return;
    setCreating(true);
    setCreateError(null);
    setRepeats(null);
    try {
      const roundNumber = await createMultipleRoundsAPI(activeLeague, selected.map((t) => t.id), rounds, window, allowRepeats);
      // replace, so the back button doesn't lead to this form again
      router.replace(`/round/pairings/${roundNumber}?league=${activeLeague}`);
    } catch (e) {
      if (e instanceof RepeatMatchupsError) setRepeats(e.repeats);
      else setCreateError(e instanceof Error ? e.message : "Kolo nije moguće napraviti.");
      setCreating(false);
    }
  };
  // a bigger window gives every team more possible opponents; once one window holds every team it can't grow further
  const expandedWindow = Math.min(MAX_WINDOW, windowSize + 2);
  const canExpand = windowSize < count && windowSize < MAX_WINDOW;
  const expandWindow = () => {
    setWindowSize(expandedWindow);
    create({window: expandedWindow});
  };
  const repeatsDialog = repeats && (
    <RepeatsDialog
      repeats={repeats}
      windowSize={windowSize}
      expandedWindow={canExpand ? expandedWindow : null}
      onContinue={() => create({allowRepeats: true})}
      onExpand={expandWindow}
      onClose={() => setRepeats(null)}
    />
  );

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
    <PrimaryButton onClick={() => create()} disabled={count < 2} loading={creating}>
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
            {!teamState && teams && <NotInRound teams={teams} isOn={isOn} inactive={inactive} onAddBack={toggle} />}
            <Box sx={{mt: "auto", display: "flex", flexDirection: "column", gap: "10px"}}>
              {createError && <ErrorNote>{createError}</ErrorNote>}
              {createButton}
            </Box>
          </Box>
          {repeatsDialog}
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
      {repeatsDialog}
    </Screen>
  );
}

// The rounds can't be made without some teams meeting twice today (with each other earlier today, or in two of the
// new rounds). The admin creates them anyway or tries again with a bigger window, which gives everyone more opponents.
function RepeatsDialog({
  repeats,
  windowSize,
  expandedWindow,
  onContinue,
  onExpand,
  onClose,
}: {
  repeats: [string, string][];
  windowSize: number;
  // null when the window already holds every team
  expandedWindow: number | null;
  onContinue: () => void;
  onExpand: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby={titleId}
      slotProps={{backdrop: {sx: {background: "rgba(21,24,31,.32)"}}}}
      PaperProps={{sx: {width: 480, maxWidth: "calc(100% - 32px)", m: "16px", borderRadius: "24px", p: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 30px 80px rgba(21,24,31,.3)"}}}
    >
      <Box sx={{display: "flex", alignItems: "center", gap: "12px"}}>
        <Box aria-hidden sx={{width: 44, height: 44, flex: "none", borderRadius: "14px", background: "rgba(188,71,73,.1)", color: color.red, display: "flex", alignItems: "center", justifyContent: "center", "& svg": {fontSize: 26}}}>
          <WarningRoundedIcon />
        </Box>
        <Box component="h2" id={titleId} sx={{m: 0, fontFamily: font.display, fontSize: 24, fontWeight: 800, lineHeight: 1.1}}>
          Some teams will play twice today
        </Box>
      </Box>
      <Box component="ul" aria-label="Ekipe koje se danas sastaju dvaput" sx={{listStyle: "none", m: 0, p: "4px 14px", borderRadius: "16px", background: color.paper, maxHeight: 220, overflowY: "auto"}}>
        {repeats.map(([a, b], i) => (
          <Box
            component="li"
            key={`${a}-${b}-${i}`}
            sx={{minHeight: 40, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "center", gap: "8px", fontSize: 15, fontWeight: 600, borderBottom: i < repeats.length - 1 ? "1px solid rgba(60,74,103,.1)" : "none", "& > span:not([aria-hidden])": {overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}}
          >
            <span>{a}</span>
            <Box component="span" aria-hidden sx={{fontSize: 13, color: color.placeholder}}>
              vs
            </Box>
            <Box component="span" sx={{textAlign: "right"}}>
              {b}
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{fontSize: 14, lineHeight: 1.4, color: color.inkSoft}}>
        {expandedWindow
          ? `A bigger window gives every team more opponents to choose from (window ${windowSize} → ${expandedWindow}).`
          : "The window already holds every team, so it can't be expanded."}
      </Box>
      <Box sx={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
        <OutlineButton height={52} onClick={onExpand} disabled={!expandedWindow} sx={{flex: "1 1 160px", fontSize: 16, border: `1.5px solid rgba(60,74,103,.25)`, "&:disabled": {opacity: 0.4}}}>
          Expand the window
        </OutlineButton>
        <SolidButton height={52} onClick={onContinue} sx={{flex: "1 1 160px", fontSize: 16}}>
          Continue
        </SolidButton>
      </Box>
    </Dialog>
  );
}

// Desktop: the teams that won't be paired tonight, so the admin sees who's missing without scanning the list.
// "Inactive" teams are off because Manage League marks them inactive, "Off" ones were switched off here; a click
// on either puts the team back in the round.
function NotInRound({
  teams,
  isOn,
  inactive,
  onAddBack,
}: {
  teams: LeagueTeam[];
  isOn: (t: LeagueTeam) => boolean;
  inactive: Set<number>;
  onAddBack: (id: number) => void;
}) {
  const out = teams.filter((t) => !isOn(t));
  const inactiveOut = out.filter((t) => inactive.has(t.id)).length;
  return (
    <Box component="section" aria-labelledby="cr-out" sx={{display: "flex", flexDirection: "column", gap: "8px", minHeight: 0}}>
      <Box sx={{px: "6px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px"}}>
        <SectionLabel id="cr-out" sx={{px: 0}}>
          Not in this round
        </SectionLabel>
        <Box component="span" sx={{fontSize: 13, fontWeight: 700, color: color.muted, fontVariantNumeric: "tabular-nums"}}>
          {teams.length - out.length} / {teams.length} playing
        </Box>
      </Box>
      <Card sx={{borderRadius: "18px", p: "14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0}}>
        <Box role="status" sx={{display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap"}}>
          <Box component="span" sx={{fontFamily: font.display, fontSize: 34, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums"}}>
            {out.length}
          </Box>
          <Box component="span" sx={{fontSize: 14, color: color.inkSoft}}>
            {out.length === 1 ? "team will sit out" : "teams will sit out"}
          </Box>
          {out.length > 0 && (
            <Box component="span" sx={{ml: "auto", fontSize: 12, fontWeight: 600, color: color.muted, whiteSpace: "nowrap"}}>
              {inactiveOut} inactive · {out.length - inactiveOut} off
            </Box>
          )}
        </Box>
        {out.length > 0 ? (
          <Box component="ul" aria-label="Ekipe koje ne igraju" sx={{listStyle: "none", m: 0, p: 0, display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: "6px", maxHeight: 228, overflowY: "auto", scrollbarGutter: "stable"}}>
            {out.map((t) => {
              const why = inactive.has(t.id) ? "Inactive" : "Off";
              return (
                <Box component="li" key={t.id} sx={{minWidth: 0, maxWidth: "100%"}}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onAddBack(t.id)}
                    title={why === "Inactive" ? "Inactive in Manage League · click to add for tonight" : "Click to add back"}
                    aria-label={`${t.name}, ${why}. Dodaj u kolo`}
                    sx={{
                      ...buttonBase,
                      maxWidth: "100%",
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      pl: "12px",
                      pr: "6px",
                      borderRadius: "16px",
                      background: why === "Inactive" ? color.paper : "rgba(188,71,73,.1)",
                      color: why === "Inactive" ? color.muted : color.red,
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Box component="span" sx={{overflow: "hidden", textOverflow: "ellipsis"}}>
                      {t.name}
                    </Box>
                    <Box
                      component="span"
                      aria-hidden
                      sx={{height: 20, px: "6px", flex: "none", borderRadius: "10px", background: "rgba(255,255,255,.7)", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", display: "flex", alignItems: "center"}}
                    >
                      {why}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{fontSize: 14, fontWeight: 600, color: color.green}}>All teams are in this round.</Box>
        )}
      </Card>
    </Box>
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
