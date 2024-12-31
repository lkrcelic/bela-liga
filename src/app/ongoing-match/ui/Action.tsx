import React from 'react';
import {useParams, usePathname, useRouter} from "next/navigation";
import useResultStore from "@/app/store/bela/resultStore";
import SingleActionButton from "@/app/ui/singeActionButton";
import useOngoingMatchStore from "@/app/store/ongoingMatchStore";
import {createOngoingMatchAPI} from "@/app/fetchers/ongoingMatch/create";
import {createMatchAPI} from "@/app/fetchers/match/create";
import useRoundStore from "@/app/store/RoundStore";

export default function Action() {
  const {
    ongoingMatch: {
      player_pair1_score,
      player_pair2_score,
      seating_order,
      current_shuffler_index
    },
    resetOngoingMatch
  } = useOngoingMatchStore();
  const {roundData: {id, team1_wins, team2_wins}} = useRoundStore();
  const {setMatchId} = useResultStore();

  const router = useRouter();
  const {matchId} = useParams();
  const pathname = usePathname();


  const getProps = () => {
    if ((player_pair1_score >= 1001 || player_pair2_score >= 1001) && player_pair1_score !== player_pair2_score) {
      return {
        label: "Završi meč",
        onClick: async () => {
          await createMatchAPI(Number(matchId));

          if (team1_wins + team2_wins < 1) {
            const response = await createOngoingMatchAPI({
              round_id: Number(id),
              seating_order_ids: seating_order?.map((player) => player.id),
              current_shuffler_index: current_shuffler_index | 0,
              score_threshold: 1001,
            })

            resetOngoingMatch();
            router.push(`/ongoing-match/${response.id}`);
          }

          if (team1_wins + team2_wins >= 1) {
            resetOngoingMatch();
            router.push(`/round/${id}/result`);
          }
        },
      }
    } else {
      return {
        label: "Upiši igru",
        onClick: () => {
          setMatchId(Number(matchId));
          router.push(`${pathname}/ongoing-result/new/trump-caller`);
        },
      }
    }
  };

  const props = getProps();

  return <SingleActionButton label={props.label} onClick={props.onClick}/>
}
