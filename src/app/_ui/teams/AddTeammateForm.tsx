"use client";

import {addTeammateAPI} from "@/app/_fetchers/team/addTeammate";
import {ErrorNote, PrimaryButton, SolidButton, SuccessNote} from "@/app/_ui/sp";
import {Box} from "@mui/material";
import React, {useState} from "react";
import {PlayerOption, PlayerPicker, TeamOption, TeamPicker} from "./pickers";

export default function AddTeammateForm({compact = false}: {compact?: boolean}) {
  const [team, setTeam] = useState<TeamOption | null>(null);
  const [player, setPlayer] = useState<PlayerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const alreadyIn = !!team && !!player && team.players.includes(player.title);
  const ready = !!team && !!player && !alreadyIn;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !ready) return;
    setSubmitting(true);
    setError(null);
    setDone(null);
    try {
      await addTeammateAPI(team.id, player.id);
      setDone(`Dodano: ${player.title} u ekipu ${team.title}.`);
      setTeam(null);
      setPlayer(null);
    } catch {
      setError("Igrača nije moguće dodati u ekipu.");
    }
    setSubmitting(false);
  };

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{display: "flex", flexDirection: "column", gap: compact ? "16px" : "14px", flex: 1}}>
      <TeamPicker label="Team" placeholder="Search Team" value={team} onChange={setTeam} soft={compact} />
      <PlayerPicker
        label="Player"
        placeholder="Search Player"
        value={player}
        onChange={setPlayer}
        soft={compact}
      />
      {alreadyIn && <ErrorNote>{player.title} je već u ekipi {team.title}.</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {done && <SuccessNote>{done}</SuccessNote>}
      {compact ? (
        <SolidButton type="submit" loading={submitting} disabled={!ready}>
          Add Teammate
        </SolidButton>
      ) : (
        <PrimaryButton type="submit" loading={submitting} disabled={!ready} sx={{mt: "auto"}}>
          Add Teammate
        </PrimaryButton>
      )}
    </Box>
  );
}
