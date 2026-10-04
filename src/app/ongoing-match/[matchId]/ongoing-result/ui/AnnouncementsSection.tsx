import React from "react";
import {Badge, Box, Button} from "@mui/material";
import {Grid} from "@mui/system";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";

export default function AnnouncementSection() {
    const {
        teamsAnnouncements,
        setAnnouncement,
        resetTeamAnnouncements,
    } = useAnnouncementStore();
    const {resultData: {activeTeam}, updateAnnouncementPoints} = useResultStore();
    const team = activeTeam === "team2" ? 2 : 1;

    React.useEffect(() => {
        updateAnnouncementPoints(teamsAnnouncements);
    }, [teamsAnnouncements, updateAnnouncementPoints]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Grid
                container
                spacing={2}
                justifyContent="center"
                sx={{marginBottom: 4}}
            >
                {[20, 50, 100, 150, 200].map((points) => (
                    <Grid item key={points}>
                        <Badge
                            badgeContent={teamsAnnouncements[team]?.announcementCounts[points]}
                            color="primary"
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                        >
                            <Button
                                color="secondary"
                                variant="contained"
                                sx={{fontSize: "16px", minWidth: "60px", height: "60px"}}
                                onClick={() => setAnnouncement(team, points)}
                            >
                                {points}
                            </Button>
                        </Badge>
                    </Grid>
                ))}
                <Grid item>
                    <Button
                        color="error"
                        variant="outlined"
                        sx={{fontSize: "16px", minWidth: "60px", height: "60px"}}
                        onClick={() => resetTeamAnnouncements(team)}
                    >
                        Obriši zvanja
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
