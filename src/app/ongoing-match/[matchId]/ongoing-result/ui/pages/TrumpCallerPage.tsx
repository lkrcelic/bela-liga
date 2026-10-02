"use client"

import React from "react";
import {Box, Typography} from "@mui/material";
import TrumpCallerSection from "@/app/ongoing-match/[matchId]/ongoing-result/ui/TrumpCallerSection";
import useResultStore from "@/app/_store/bela/resultStore";
import {useParams, useRouter} from "next/navigation";
import DoubleActionButton from "@/app/_ui/DoubleActionButton";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";

export default function TrumpCallerPage({actionType}: ActionProps) {
  return (
    <>
      <Box sx={{gridArea: "top", alignSelf: "end"}}>
        <Typography variant="h4" color="black" align="center">
          Izaberi tko je zvao
        </Typography>
      </Box>
      <Box sx={{gridArea: "body", alignSelf: "center"}}>
        <TrumpCallerSection/>
      </Box>
      <Box sx={{gridArea: "actions", alignSelf: "start"}}>
        <ActionButtons actionType={actionType}/>
      </Box>
    </>);
};

export type ActionProps = {
  actionType: "CREATE" | "UPDATE";
}

function ActionButtons({actionType}: ActionProps) {
  const {resultData: {trump_caller_team}, resetResult} = useResultStore();
  const {resetAnnouncements} = useAnnouncementStore();
  const router = useRouter();
  const params = useParams();

  const firstButtonOnClick = () => {
    resetResult();
    resetAnnouncements();
    window.history.back();
  }

  let href;
  if (actionType === "CREATE") {
    href = `/ongoing-match/${params.matchId}/ongoing-result/new/announcement`
  }
  if (actionType === "UPDATE") {
    href = `/ongoing-match/${params.matchId}/ongoing-result/${params.resultId}/announcement`
  }

  return <DoubleActionButton
    firstButtonOnClick={firstButtonOnClick}
    secondButtonLabel={"Dalje"}
    secondButtonOnClick={() => router.push(href)}
    secondButtonDisabled={trump_caller_team == undefined}
  />
}