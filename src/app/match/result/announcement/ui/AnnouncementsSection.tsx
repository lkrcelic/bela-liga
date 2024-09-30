import React from "react";
import {Badge, Box, Button} from "@mui/material";
import {Grid} from "@mui/system";
import useAnnouncementStore from "@/app/store/announcementStore";
import useResultStore from "@/app/store/resultStore";

export default function AnnouncementSection() {
    const {
        playerAnnouncements,
        setAnnouncement,
        resetPlayerAnnouncements,
        activePlayerId,
    } = useAnnouncementStore();
    const {updateAnnouncementPoints} = useResultStore();

    React.useEffect(() => {
        updateAnnouncementPoints(playerAnnouncements);
    }, [playerAnnouncements, updateAnnouncementPoints]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#fefefe",
            }}
        >
            <Grid
                container
                spacing={2}
                justifyContent="center"
                sx={{marginBottom: 6}}
            >
                {[20, 50, 100, 150, 200].map((points) => (
                    <Grid item key={points}>
                        <Badge
                            badgeContent={
                                playerAnnouncements[activePlayerId].announcementCounts[points]
                            }
                            color="primary"
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                        >
                            <Button
                                variant="outlined"
                                sx={{fontSize: "16px", minWidth: "60px", height: "60px"}}
                                onClick={() => setAnnouncement(activePlayerId, points)}
                            >
                                {points}
                            </Button>
                        </Badge>
                    </Grid>
                ))}
                <Grid item>
                    <Button
                        variant="outlined"
                        sx={{fontSize: "16px", minWidth: "60px", height: "60px"}}
                        onClick={() => resetPlayerAnnouncements(activePlayerId)}
                    >
                        Obriši zvanja
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
