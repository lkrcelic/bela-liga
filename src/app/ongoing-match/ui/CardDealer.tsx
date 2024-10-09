import {Box, Typography} from '@mui/material';
import React from "react"; // Adjust this import based on your store setup

export default function CardDealer() {
    //const { currentDealer } = useMatchStore();
    const currentDealer = "L.K.";

    return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Box component="img" src="/card.png" alt="Card dealer" sx={{width: "30px", height: 'auto', paddingRight: 2}}/>
            <Typography alignSelf="end" sx={{fontSize: 18, fontWeight: 'bold'}}>
                {currentDealer}
            </Typography>
        </Box>
    );
}
;


