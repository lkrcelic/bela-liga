import {createMatchAPI} from "@/app/_fetchers/match/create";
import {createOngoingMatchAPI} from "@/app/_fetchers/ongoingMatch/create";
import {finishRoundAPI} from "@/app/_fetchers/round/finish";
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
    ongoingMatch: {player_pair1_score, player_pair2_score},
    resetOngoingMatch,
  } = useOngoingMatchStore();
  const {
    roundData: {id, team1_wins, team2_wins},
  } = useRoundStore();
  const {setMatchId, resetResult} = useResultStore();
  const {resetAnnouncements} = useAnnouncementStore();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const {matchId} = useParams();
  const pathname = usePathname();

  const getProps = () => {
    if ((player_pair1_score >= 1001 || player_pair2_score >= 1001) && player_pair1_score !== player_pair2_score) {
      return {
        label: "Završi meč",
        icon: <DoneIcon />,
        onClick: async () => {
          if (isLoading) return;
          setIsLoading(true);
          try {
            await createMatchAPI(Number(matchId));

            if (team1_wins + team2_wins == 0) {
              const response = await createOngoingMatchAPI({
                round_id: Number(id),
                score_threshold: 1001,
              });

              resetOngoingMatch();
              router.push(`/ongoing-match/${response.id}`);
            }

            if (team1_wins + team2_wins > 0) {
              router.push(`/round/${id}/result`);
              await finishRoundAPI(Number(id));
              resetOngoingMatch();
              localStorage.clear();
            }
          } finally {
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

  return <SingleActionButton fullWidth={isMobile} label={props.label} onClick={props.onClick} icon={props.icon} />;
}
