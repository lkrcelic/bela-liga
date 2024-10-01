import React from "react";
import {Button} from "@mui/material";
import {Grid} from "@mui/system";
import useResultStore from "@/app/store/resultStore";

const DigitGrid = () => {
    const updateScore = useResultStore((state) => state.updateScore);
    const resetScore = useResultStore((state) => state.resetScore);
    const setStiglja = useResultStore((state) => state.setStiglja);
    const stigljaActive = useResultStore((state) => state.stigljaActive);

    const handleClick = (digit: number) => {
        updateScore(digit);
    };

    return (
        <Grid container spacing={2} sx={{marginTop: 3}}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "štiglja", 0, "X"].map((digit, index) => (
                <Grid
                    item
                    size={{xs: 4}}
                    key={index}
                    sx={digit === "skip" ? {visibility: "hidden"} : {}}
                >
                    {typeof digit === "number" && (
                        <Button
                            color="secondary"
                            variant="contained"
                            sx={{width: "100%", height:"70px",fontSize: "24px"}}
                            onClick={() => handleClick(digit as number)}
                            disabled={stigljaActive}
                        >
                            {digit}
                        </Button>
                    )}
                    {digit === "X" && (
                        <Button
                            color="error"
                            variant="outlined"
                            sx={{width: "100%", height: "70px", fontSize: "24px"}}
                            onClick={resetScore}
                        >
                            X
                        </Button>
                    )}
                    {digit === "štiglja" && (
                        <Button
                            color="secondary"
                            variant="contained"
                            sx={{width: "100%",height: "70px", fontSize: "20px",fontWeight:"500" , color:"#3C4A67"}}
                            onClick={setStiglja}
                        >
                            Štiglja
                        </Button>
                    )}
                </Grid>
            ))}
        </Grid>
    );
};

export default DigitGrid;
