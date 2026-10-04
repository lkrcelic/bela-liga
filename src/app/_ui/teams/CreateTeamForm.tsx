"use client";

import {createTeamAPI} from "@/app/_fetchers/team/create";
import {ErrorNote, PrimaryButton, SolidButton, SuccessNote, TextField} from "@/app/_ui/sp";
import {Box} from "@mui/material";
import React, {useState} from "react";
import {PlayerOption, PlayerPicker} from "./pickers";

// Team name + two founders. compact: the desktop card version (side-by-side founders, smaller submit)
export default function CreateTeamForm({compact = false}: {compact?: boolean}) {
  const [name, setName] = useState("");
  const [founder1, setFounder1] = useState<PlayerOption | null>(null);
  const [founder2, setFounder2] = useState<PlayerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [done, setDone] = useState<string | null>(null);

  const ready = name.trim() && founder1 && founder2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setDone(null);
    if (!name.trim()) {
      setNameError("Upiši ime ekipe.");
      return;
    }
    if (!founder1 || !founder2) {
      setError("Odaberi oba osnivača.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTeamAPI(name.trim(), founder1.id, founder2.id);
      setDone(`Ekipa ${name.trim()} je napravljena.`);
      setName("");
      setFounder1(null);
      setFounder2(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ekipu nije moguće napraviti.");
    }
    setSubmitting(false);
  };

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{display: "flex", flexDirection: "column", gap: compact ? "16px" : "14px", flex: 1}}>
      <TextField
        label="Team name"
        placeholder="Enter Team Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(undefined);
        }}
        error={nameError}
        soft={compact}
      />
      <Box sx={compact ? {display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "12px"} : {display: "flex", flexDirection: "column", gap: "14px"}}>
        <PlayerPicker label="Founder 1" placeholder="Search Founder 1" value={founder1} onChange={setFounder1} exclude={founder2 ? [founder2.id] : []} soft={compact} />
        <PlayerPicker label="Founder 2" placeholder="Search Founder 2" value={founder2} onChange={setFounder2} exclude={founder1 ? [founder1.id] : []} soft={compact} />
      </Box>
      {error && <ErrorNote>{error}</ErrorNote>}
      {done && <SuccessNote>{done}</SuccessNote>}
      {compact ? (
        <SolidButton type="submit" loading={submitting} disabled={!ready} sx={{mt: "4px"}}>
          Submit
        </SolidButton>
      ) : (
        <PrimaryButton type="submit" loading={submitting} disabled={!ready} sx={{mt: "auto"}}>
          Submit
        </PrimaryButton>
      )}
    </Box>
  );
}
