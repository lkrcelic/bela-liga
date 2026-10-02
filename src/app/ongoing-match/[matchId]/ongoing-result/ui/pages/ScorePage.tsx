"use client";

import React, {useState} from "react";
import {Alert, Box} from "@mui/material";
import DigitGrid from "@/app/ongoing-match/[matchId]/ongoing-result/ui/DigitGrid";
import useResultStore from "@/app/_store/bela/resultStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/_ui/DoubleActionButton";
import {updateOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/updateOne";
import {createOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/create";
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
    updateAnnouncementPoints,
  } = useResultStore();
  const {resetAnnouncements} = useAnnouncementStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();

  const handleSave = async () => {
    if (isLoading) return; // Prevent double execution
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // The announcements entered on the previous step, so the saved hand always matches them
      updateAnnouncementPoints(useAnnouncementStore.getState().teamsAnnouncements);
      setTotalPoints();
      const updatedResultData = useResultStore.getState?.().resultData;
      updatedResultData.match_id = Number(params.matchId);

      if (actionType === "CREATE") {
        await createOngoingBelaResultAPI({result: updatedResultData})
      }
      if (actionType === "UPDATE") {
        await updateOngoingBelaResultAPI({resultId: params.resultId, result: updatedResultData})
      }
      
      resetResult();
      resetAnnouncements();

      router.push(`/ongoing-match/${params.matchId}`);
    } catch (error) {
      console.error("Error saving result:", error);
      setErrorMessage(error instanceof Error ? error.message : "Spremanje nije uspjelo.");
      setIsLoading(false); // Reset loading state on error
    }
  };

  return <>
    {errorMessage && <Alert severity="error" sx={{mb: 1}}>{errorMessage}</Alert>}
    <DoubleActionButton
    secondButtonLabel={isLoading ? "Spremanje..." : "Spremi"}
    secondButtonOnClick={handleSave}
    secondButtonDisabled={isLoading || (resultData.player_pair1_game_points === 0 && resultData.player_pair2_game_points === 0)}
    />
  </>

}
