import React from 'react';
import {Button, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import {useRouter} from "next/navigation";

export default function Action() {
    const router = useRouter();


    return (
        <Grid container justifyContent="space-between">
            <Grid item size={{xs: 12}}>
                <Button variant="contained" color="primary" sx={{width: '100%'}}
                        onClick={() => router.push("/match/result/trump-caller")}>
                    <Typography variant="h6">Upisi igru</Typography>
                </Button>
            </Grid>
        </Grid>
    );
}