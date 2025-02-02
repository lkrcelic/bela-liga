"use client"

import React, {useState} from 'react';
import {Autocomplete, Box, Button, TextField} from '@mui/material';
import Image from "next/image";
import {createTeamAPI} from "@/app/fetchers/team/create";

export default function CreateTeam() {
  const [formData, setFormData] = useState({
    team_name: '',
    founder_1: null,
    founder_2: null,
  });

  const players = [
    {id: 7, name: 'Player One'},
    {id: 8, name: 'Player Two'},
    {id: 4, name: 'Player Three'},
  ];


  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
    console.log(formData)

  };

  const handleAutocompleteChange = (name, value) => {
    console.log("Name: ", name)
    console.log("value: ", value)
    setFormData({...formData, [name]: value});
    console.log(formData)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTeamAPI(formData.team_name, formData.founder_1.id, formData.founder_2.id);

    setFormData({
      team_name: '',
      founder_1: null,
      founder_2: null,
    });
  };


  return (
    <>
      <Box sx={{gridArea: "top", alignItems: "center", display: "flex", justifyContent: "center"}}>
        <Image src="/TitleBackground.png"
               alt="Logo"
               width={300}
               height={300}
               style={{width: '100%', height: 'auto', maxWidth: "600px"}}
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
          //options={players.filter(player => player.id !== formData.founder_id2?.id)}
          options={players}
          getOptionLabel={(option) => option.name}
          value={formData.founder_1}
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
        <Autocomplete
          //options={players.filter(player => player.id !== formData.founder_id1?.id)}
          options={players}
          getOptionLabel={(option) => option.name}
          value={formData.founder_2}
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
        <Button
          type="submit"
          onClick={(e) => handleSubmit(e)}
          variant="contained"
          color="primary"
          fullWidth
          sx={{mt: 2}}
        >
          Submit
        </Button>
      </Box>
    </>
  );
}
