import React from "react";
import { Button } from "@mui/material";
import { Grid } from "@mui/system";
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
    <Grid container spacing={2} sx={{ marginTop: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "štiglja", 0, "X"].map((digit, index) => (
        <Grid
          item
          size={{ xs: 4 }}
          key={index}
          sx={digit === "skip" ? { visibility: "hidden" } : {}}
        >
          {typeof digit === "number" && (
            <Button
              variant="contained"
              sx={{ width: "100%", fontSize: "24px" }}
              onClick={() => handleClick(digit as number)}
              disabled={stigljaActive}
            >
              {digit}
            </Button>
          )}
          {digit === "X" && (
            <Button
              sx={{ width: "100%", fontSize: "24px" }}
              onClick={resetScore}
              variant="outlined"
            >
              X
            </Button>
          )}
          {digit === "štiglja" && (
            <Button
              variant="outlined"
              color="primary"
              sx={{ width: "100%", fontSize: "20px", height: "100%" }}
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
