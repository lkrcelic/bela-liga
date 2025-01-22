"use client";

import React from "react";
import {Box} from "@mui/material";
import DigitGrid from "@/app/ongoing-match/[matchId]/ongoing-result/ui/DigitGrid";
import useResultStore from "@/app/store/bela/resultStore";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/ui/DoubleActionButton";
import {updateOngoingBelaResultAPI} from "@/app/fetchers/ongoingBelaResult/updateOne";
import {createOngoingBelaResultAPI} from "@/app/fetchers/ongoingBelaResult/create";
import {ActionProps} from "@/app/ongoing-match/[matchId]/ongoing-result/ui/pages/TrumpCallerPage";

export default function ScorePage({actionType}: ActionProps) {
  return (
    <>

      <Box sx={{gridArea: "body", alignSelf: "end"}}>
        <DigitGrid/>
      </Box>
      <Box sx={{gridArea: "actions", alignSelf: "start"}}>
        <ActionButtons actionType={actionType}/>
      </Box>
    </>
  );
}

function ActionButtons({actionType}: ActionProps) {
  const {
    resultData,
    resetResult,
    setTotalPoints,
    setCardShufflerIdAndTrumpCallerPosition,
  } = useResultStore();
  const {
    ongoingMatch: {
      playerPair1,
      playerPair2,
      seating_order,
      current_shuffler_index,
    },
  } = useOngoingMatchStore();
  const {resetAnnouncements} = useAnnouncementStore();

  const router = useRouter();
  const params = useParams();

  const handleSave = async () => {
    setTotalPoints(playerPair1, playerPair2);
    setCardShufflerIdAndTrumpCallerPosition(seating_order!, current_shuffler_index!);
    const updatedResultData = useResultStore.getState?.().resultData;

    try {
      if (actionType === "CREATE") {
        await createOngoingBelaResultAPI({result: updatedResultData})
      }
      if (actionType === "UPDATE") {
        await updateOngoingBelaResultAPI({resultId: params.resultId, result: updatedResultData})
      }
    } catch (error) {
      console.error(error);
    }

    resetResult();
    resetAnnouncements();

    router.push(`/ongoing-match/${params.matchId}`);
  };

  return <DoubleActionButton
    secondButtonLabel={"Spremi"}
    secondButtonOnClick={handleSave}
    secondButtonDisabled={resultData.player_pair1_game_points === 0 && resultData.player_pair2_game_points === 0}
  />

}
