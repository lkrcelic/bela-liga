import {Grid} from "@mui/system";
import {Button, Typography} from "@mui/material";
import React from "react";

type SingleActionButtonProps = {
    label: string;
    onClick: () => void;
}

export default function SingleActionButton({onClick, label}: SingleActionButtonProps) {
    return (
        <Grid container>
            <Grid item size={{xs: 12}}>
                <Button variant="contained" color="primary" sx={{width: '100%'}}
                        onClick={onClick}>
                    < Typography variant="h6">{label}</Typography>
                </Button>
            </Grid>
        </Grid>
    );
}