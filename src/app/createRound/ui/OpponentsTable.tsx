"use client";

import {useState, useEffect} from "react";
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper} from "@mui/material";
import {getRoundsByRoundNumber} from "@/app/fetchers/round/getRoundsByRoundNumber";
import {RoundMatchup} from "@/app/lib/service/round/getRoundMatchups";

export interface MatchupTableEntry {
  id: number;
  team1: string;
  team2: string;
}

interface MatchupTableProperties {
  roundNumber: number;
}

export default function OpponentsTable({roundNumber}: MatchupTableProperties) {
  const [entries, setEntries] = useState<MatchupTableEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRoundsByRoundNumber(roundNumber);
      setEntries(
        data.map((round: RoundMatchup) => ({
          id: round.id,
          team1: round.team1?.team_name ?? "",
          team2: round.team2?.team_name ?? "",
        }))
      );
      console.log(entries);
    };
    fetchData();
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{borderBottom: "1px solid black"}}>
              Team 1
            </TableCell>
            <TableCell align="center" sx={{borderBottom: "1px solid black"}}>
              Team 2
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell align="center" sx={{borderBottom: "1px solid lightgray"}}>
                {entry.team1}
              </TableCell>
              <TableCell align="center" sx={{borderBottom: "1px solid lightgray"}}>
                {entry.team2}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
