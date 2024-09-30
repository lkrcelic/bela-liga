import {Button, Typography} from "@mui/material";

type ScoreBoxProps = {
    label?: string;
    teamColor: string;
    value: string;
    secondValue?: string;
    variant: "h4" | "h6";
    setActiveTeam?: () => void;
}

export function TeamScoreBox({label, teamColor, setActiveTeam, value, secondValue, variant}: ScoreBoxProps) {
    return (
        <>
            <Button
                onClick={setActiveTeam}
                sx={{
                    width: "100%",
                    height: "82px",
                    backgroundColor: teamColor,
                    color: "white",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "start",
                    paddingLeft: 2,
                }}
            >
                {(label && <Typography variant="caption">{label}</Typography>)}
                {(value && <Typography variant={variant}>{value}</Typography>)}
            </Button>
            {(secondValue && <Typography variant="caption" color="black" paddingLeft={1}>{"Σ: " + secondValue}</Typography>)}
        </>
    );
}
