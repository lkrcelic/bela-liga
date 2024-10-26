import {Box, Typography} from '@mui/material';
import React from "react";
import useMatchStore from "@/app/store/matchStore"; // Adjust this import based on your store setup

export default function CardDealer() {
    const {seating_order, current_shuffler_index} = useMatchStore(state => state.matchData);
    const currentDealer = seating_order![current_shuffler_index];

    return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Box component="img" src="/card.png" alt="Card dealer"
                 sx={{width: "30px", height: 'auto', paddingRight: 2}}/>
            <Typography alignSelf="end" sx={{fontSize: 18, fontWeight: 'bold'}}>
                {currentDealer?.username}
            </Typography>
        </Box>
    );
}
;


