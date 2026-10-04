import {createMatchAPI, MatchAlreadyFinishedError} from "@/app/_fetchers/match/create";
import {currentRoundPath} from "@/app/ongoing-match/ui/currentRoundPath";
import {matchWinner} from "@/app/_lib/bela/scoring";
import useResultStore from "@/app/_store/bela/resultStore";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useOngoingMatchStore from "@/app/_store/ongoingMatchStore";
import useRoundStore from "@/app/_store/RoundStore";
import theme from "@/app/_styles/theme";
import SingleActionButton from "@/app/_ui/SingleActionButton";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DoneIcon from "@mui/icons-material/Done";
import {useMediaQuery} from "@mui/material";
import {useParams, usePathname, useRouter} from "next/navigation";
import {useState} from "react";

export default function Action() {
  const {
    ongoingMatch: {player_pair1_score, player_pair2_score, score_threshold},
    resetOngoingMatch,
  } = useOngoingMatchStore();
  const {
    roundData: {id},
  } = useRoundStore();
  const {setMatchId, resetResult} = useResultStore();
  const {resetAnnouncements} = useAnnouncementStore();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const {matchId} = useParams();
  const pathname = usePathname();

  const goToCurrentState = async () => {
    resetOngoingMatch();
    router.replace(await currentRoundPath(id));
  };

  const getProps = () => {
    if (matchWinner(player_pair1_score, player_pair2_score, score_threshold ?? 1001) !== null) {
      return {
        label: "Završi meč",
        icon: <DoneIcon />,
        onClick: async () => {
          if (isLoading) return;
          setIsLoading(true);
          try {
            const outcome = await createMatchAPI(Number(matchId));
            resetOngoingMatch();

            // replace, so going back doesn't open the match that no longer exists
            if (outcome.nextOngoingMatchId) {
              router.replace(`/ongoing-match/${outcome.nextOngoingMatchId}`);
            } else {
              router.replace(`/round/${outcome.roundId ?? id}/result`);
            }
          } catch (error) {
            if (error instanceof MatchAlreadyFinishedError) {
              // Someone else finished it - follow them to the next match or to the round result
              await goToCurrentState();
              return;
            }
            console.error(error);
            setIsLoading(false);
          }
        },
      };
    } else {
      return {
        label: "Upiši igru",
        icon: <AddCircleIcon />,
        onClick: () => {
          resetResult();
          resetAnnouncements();
          setMatchId(Number(matchId));
          router.push(`${pathname}/ongoing-result/new/trump-caller`);
        },
      };
    }
  };

  const props = getProps();

  return <SingleActionButton fullWidth={isMobile} label={props.label} onClick={props.onClick} icon={props.icon} disabled={isLoading} />;
}
