import React from 'react';
import {ButtonBase, Typography} from '@mui/material';
import {Grid} from "@mui/system";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";
import {usePathname, useRouter} from "next/navigation";
import {getOngoingBelaResultAPI} from "@/app/_fetchers/ongoingBelaResult/getOne";
import useResultStore from "@/app/_store/bela/resultStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import {BelaPlayerAnnouncementResponse} from "@/app/_interfaces/belaPlayerAnnouncement";

export default function ResultsDisplay() {
    const router = useRouter();
    const pathname = usePathname();
    const {ongoingMatch: {belaResults}} = useOngoingMatchStore();
    const setResultData = useResultStore(state => state.setResultData)
    const setPlayersAnnouncements = useAnnouncementStore(state => state.setPlayersAnnouncements)

    const handleOnClick = async (resultId: number | null) => {
        try {
            if (!resultId) {
                throw new Error("Result id is null");
            }
            const ongoingResult = await getOngoingBelaResultAPI(Number(resultId))
            setResultData(ongoingResult);
            setPlayersAnnouncements(ongoingResult.belaPlayerAnnouncements as BelaPlayerAnnouncementResponse[])
        } catch (error) {
            console.error(error);
        }

        router.push(`${pathname}/ongoing-result/${resultId}/trump-caller`)
    };

    return (
        <Grid container spacing={1.5} justifyContent="center">
            {belaResults?.map((result, index) => (
                <ButtonBase
                    key={index}
                    onClick={() => handleOnClick(result.result_id)}
                    sx={{width: '88%', borderRadius: '20px'}}
                >
                    <Grid container item size={{xs: 12}} justifyContent="space-evenly" alignItems="center"
                          sx={{backgroundColor: "secondary.main", borderRadius: "20px", paddingY: 0.5}}>
                        <Grid item size={{xs: 4}}>
                            <Typography variant="h4" textAlign="center" color={"default"} paddingRight={1}>
                                {result.player_pair1_total_points}
                            </Typography>
                        </Grid>

                        <Grid item size={{xs: 2}}>
                            <Typography variant="h4" textAlign="center">
                                •
                            </Typography>
                        </Grid>

                        <Grid item size={{xs: 4}}>
                            <Typography variant="h4" textAlign="center" color={"default"} paddingLeft={1}>
                                {result.player_pair2_total_points}
                            </Typography>
                        </Grid>
                    </Grid>
                </ ButtonBase>
            ))}
        </Grid>
    );
}
