"use client";

import React from 'react';
import {Box} from '@mui/material';
import TotalScoreSection from "@/app/ongoing-match/ui/TotalScoreSection";
import ResultsDisplay from "@/app/ongoing-match/ui/ResultsDisplay";
import Action from "@/app/ongoing-match/ui/Action";
import CardDealer from "@/app/ongoing-match/ui/CardDealer";
import {useParams} from "next/navigation";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";
import useAnnouncementStore from "@/app/store/bela/announcementStore";
import {getOngoingMatchAPI} from "@/app/fetchers/ongoingMatch/getOne";
import {getRoundDataAPI} from "@/app/fetchers/round/getOne";
import useRoundStore from "@/app/store/RoundStore";

const MobileScoreBoard = () => {
    const {matchId} = useParams();

    const {setOngoingMatch} = useOngoingMatchStore();
    const setRoundData = useRoundStore(state => state.setRoundData)
    const initializePlayerAnnouncements = useAnnouncementStore(state => state.initializePlayersAnnouncements);

    const fetchOngoingMatchAndRoundData = async () => {
        try {
            const response = await getOngoingMatchAPI(Number(matchId));
            setOngoingMatch(response);
            initializePlayerAnnouncements(response.playerPair1, response.playerPair2);

            const data = await getRoundDataAPI(Number(response.round_id));
            setRoundData(data);

        } catch (error) {
            console.error('Error fetching ongoing match or round data:', error);
        }
    }

    React.useEffect(() => {
        fetchOngoingMatchAndRoundData();
    }, [matchId]);

    return (
        <>
            <Box sx={{gridArea: "top", alignSelf: "end"}}>
                <TotalScoreSection/>
                <CardDealer/>
            </Box>
            <Box sx={{gridArea: "body", overflowY: 'auto',}}>
                <ResultsDisplay/>
            </Box>
            <Box sx={{gridArea: "actions", alignSelf: "start"}}>
                <Action/>
            </Box>
        </>
    );
};

export default MobileScoreBoard;
