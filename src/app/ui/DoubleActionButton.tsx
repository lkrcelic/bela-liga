import {Grid} from "@mui/system";
import {Button} from "@mui/material";
import React from "react";

type DoubleActionButtonProps = {
    secondLabel: string;
    secondOnClick: () => void;
    secondDisabled?: boolean;
}

export default function DoubleActionButton({secondLabel, secondOnClick, secondDisabled}: DoubleActionButtonProps) {
    return (
        <Grid container spacing={2} sx={{width: "100%"}}>
            <Grid item size={{xs: 6}}>
                <Button
                    color="primary"
                    variant="outlined"
                    sx={{width: "100%", fontSize: "16px"}}
                    onClick={() => {
                        window.history.back();
                    }}
                >
                    Nazad
                </Button>
            </Grid>
            <Grid item size={{xs: 6}}>
                <Button
                    color="primary"
                    variant="contained"
                    sx={{width: "100%", fontSize: "16px"}}
                    onClick={secondOnClick}
                    disabled={secondDisabled}
                >
                    {secondLabel}
                </Button>
            </Grid>
        </Grid>
    );
}