"use client"

import React, {useCallback, useState} from 'react';
import {Alert, Autocomplete, Box, Button, TextField} from '@mui/material';
import Image from "next/image";
import {createTeamAPI} from "@/app/_fetchers/team/create";
import {searchPlayersAPI} from "@/app/_fetchers/player/search";

export default function CreateTeam() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{severity: "success" | "error", text: string} | null>(null);
  const [formData, setFormData] = useState({
    team_name: '',
    founder_1: null,
    founder_2: null,
  });

  const fetchPlayers  = useCallback(async (value: string) => {
    if (value.length >= 2) {
      setLoading(true);
      const data = await searchPlayersAPI(value);
      setPlayers(Array.isArray(data) ? data : []);
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData({...formData, [name]: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.team_name.trim() || !formData.founder_1 || !formData.founder_2) {
      setMessage({severity: "error", text: "Enter a team name and pick both players."});
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await createTeamAPI(formData.team_name.trim(), formData.founder_1.id, formData.founder_2.id);
      setMessage({severity: "success", text: `Team ${formData.team_name.trim()} created.`});
      setFormData({
        team_name: '',
        founder_1: null,
        founder_2: null,
      });
    } catch (error) {
      setMessage({severity: "error", text: error instanceof Error ? error.message : "Failed to create team."});
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredPlayers = (players, excludePlayerId) => {
    return excludePlayerId ? players.filter(player => player.id !== excludePlayerId) : players;
  };

  return (
    <>
      <Box sx={{gridArea: "top", alignItems: "center", display: "flex", justifyContent: "center"}}>
        <Image src="/TitleBackground.png"
               alt="Logo"
               width={300}
               height={300}
               style={{width: '80%', height: 'auto', maxWidth: "600px"}}
        />
      </Box>
      <Box
        component="form"
        gridArea="body"
        onSubmit={handleSubmit}
      >
        <TextField
          name="team_name"
          placeholder="Enter Team Name"
          fullWidth
          value={formData.team_name}
          onChange={handleInputChange}
          sx={{
            bgcolor: 'secondary.main',
            borderRadius: '20px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px', // Ensures rounded corners
              padding: '6px 8px', // Controls overall padding
            },
            '& .MuiInputBase-input': {
              padding: '6px 8px', // Controls internal input padding
            },
          }}
          required
        />
        <Autocomplete
          options={getFilteredPlayers(players, formData?.founder_2?.id)}
          getOptionLabel={(option) => `${option.username} (${option.first_name} ${option.last_name})`}
          value={formData.founder_1}
          loading={loading}
          onInputChange={(e,value) => fetchPlayers(value)}
          onChange={(e, value) => handleAutocompleteChange('founder_1', value)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search Founder 1"
              fullWidth
              required
              sx={{
                bgcolor: 'secondary.main',
                borderRadius: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  padding: '6px 12px',
                },
                '& .MuiInputBase-input': {
                  padding: '6px 12px',
                },
              }}
            />
          )}
          sx={{
            mt: 2,
            borderRadius: '20px',
          }}
        />
        <Autocomplete
          options={getFilteredPlayers(players, formData?.founder_1?.id)}
          getOptionLabel={(option) => `${option.username} (${option.first_name} ${option.last_name})`}
          value={formData.founder_2}
          loading={loading}
          onInputChange={(e,value) => fetchPlayers(value)}
          onChange={(e, value) => handleAutocompleteChange('founder_2', value)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search Founder 2"
              fullWidth
              required
              sx={{
                bgcolor: 'secondary.main',
                borderRadius: '20px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px', // Ensures rounded corners for Autocomplete
                  padding: '6px 12px', // Controls overall padding
                },
                '& .MuiInputBase-input': {
                  padding: '6px 12px', // Ensures consistent input padding
                },
              }}
            />
          )}
          sx={{
            mt: 2, // Add spacing between fields
            borderRadius: '20px',
          }}
        />
      </Box>
      <Box sx={{gridArea: "actions"}}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <Button
          onClick={(e) => handleSubmit(e)}
          variant="contained"
          color="primary"
          fullWidth
          disabled={submitting}
          sx={{mt: 2}}
        >
          Submit
        </Button>
      </Box>
    </>
  );
}
