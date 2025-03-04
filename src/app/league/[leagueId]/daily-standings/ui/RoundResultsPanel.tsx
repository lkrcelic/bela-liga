import React from "react";
import {Box, Chip, Divider, Paper, Typography} from "@mui/material";
import {MatchResultCard} from "./MatchResultCard";
import Circle from '@mui/icons-material/Circle';

type MatchResult = {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  active?: boolean;
  tableNumber: number;
};

type RoundResultsPanelProps = {
  roundNumber: number;
  matches: MatchResult[];
  activeRounds?: number;
};

export function RoundResultsPanel({roundNumber, matches, activeRounds = 0}: RoundResultsPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        pb: 0,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{position: 'sticky', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Typography variant="h6" sx={{mb: 1, fontWeight: 'medium'}}>Round {roundNumber}</Typography>
        {activeRounds > 0 && (
          <Box
            sx={{
              position: 'relative',
              mb: 1.5,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '16px',
                animation: 'pulseShadow 1.5s infinite',
                zIndex: 0
              },
              '@keyframes pulseShadow': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)'
                },
                '70%': {
                  boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)'
                }
              }
            }}
          >
            <Chip
              icon={<Circle sx={{fontSize: 12}}/>}
              label={`LIVE: ${activeRounds}`}
              color="error"
              sx={{
                px: 1.5,
                fontSize: 14,
                alignItems: 'center',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 1
              }}
            />
          </Box>
        )}
      </Box>
      <Divider sx={{mb: 2}}/>
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowY: 'auto',
        height: '100%',
        minHeight: 0,
        pr: 1.5
      }}>
        {matches.map((match, index) => (
          <MatchResultCard
            key={index}
            team1Name={match.team1Name}
            team2Name={match.team2Name}
            team1Score={match.team1Score}
            team2Score={match.team2Score}
            active={match.active}
            tableNumber={match.tableNumber}
          />
        ))}
      </Box>
    </Paper>
  );
}
