import React from 'react';
import {Button, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import {useRouter} from "next/navigation";

export default function Action() {
    const router = useRouter();


    return (
        <Grid container spacing={2} justifyContent="space-between">
            <Grid item size={{xs: 12}}>
                <Button variant="contained" color="primary" sx={{width: '100%', padding: 2}}
                        onClick={() => router.push("/match/result/trump-caller")}>
                    <Typography variant="h6">Upisi igru</Typography>
                </Button>
            </Grid>
        </Grid>
    );
}