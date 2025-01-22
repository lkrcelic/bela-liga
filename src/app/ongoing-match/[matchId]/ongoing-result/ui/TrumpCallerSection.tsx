"use client";

import React from "react";
import useResultStore from "@/app/store/bela/resultStore";
import {Button, Typography} from "@mui/material";
import PlayersContainer from "@/app/ongoing-match/[matchId]/ongoing-result/ui/PlayersContainer";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";

export default function TrumpCallerSection() {
  const {ongoingMatch: {playerPair1, playerPair2}} = useOngoingMatchStore();
  const {resultData: {trump_caller_id}, setTrumpCallerId} = useResultStore();

  return (
    <PlayersContainer playerPair1={playerPair1} playerPair2={playerPair2}>
      {(player) => (
        <TrumpCallerButton
          key={player?.id}
          playerName={player?.username}
          color={[playerPair1?.player_id1, playerPair1?.player_id2].includes(player?.id) ? "team1" : "team2"}
          onClick={() => setTrumpCallerId(player?.id)}
          isTrumpCaller={player?.id === trump_caller_id}
        />
      )}
    </PlayersContainer>
  );
}

type PlayerBoxProps = {
  playerName?: string;
  color: string;
  isTrumpCaller: boolean;
  onClick?: () => void;
};

function TrumpCallerButton({playerName, color, isTrumpCaller, onClick}: PlayerBoxProps) {
  return (
    <Button
      onClick={onClick}
      color={color}
      variant={(isTrumpCaller ? 'contained' : 'outlined') as 'contained' | 'outlined'}
      sx={{
        width: "100px",
        height: "100px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle2">{playerName}</Typography>
    </Button>
  );
}
