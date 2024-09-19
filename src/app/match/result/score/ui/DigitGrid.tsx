import React from "react";
import { Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useScoreStore from "@/app/store/scoreStore";
import { Grid } from "@mui/system";

const DigitGrid = () => {
  const updateScore = useScoreStore((state) => state.updateScore);
  const deleteLastDigit = useScoreStore((state) => state.deleteLastDigit);

  const handleClick = (digit: number) => {
    updateScore(digit);
  };

  return (
    <Grid container spacing={2} sx={{ marginTop: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
        <Grid item xs={4} key={digit}>
          <Button
            variant="contained"
            sx={{ width: "100%", fontSize: "24px" }}
            onClick={() => handleClick(digit)}
          >
            {digit}
          </Button>
        </Grid>
      ))}
      <Grid item xs={4}>
        <IconButton
          sx={{ width: "100%", fontSize: "24px" }}
          onClick={deleteLastDigit}
        >
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default DigitGrid;
