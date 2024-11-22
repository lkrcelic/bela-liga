export interface Team {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  modified_score?: number | null | undefined;
  played_against: number[]; // ids of teams already played against!
}

export interface TeamPair {
  teamOne: Team;
  teamTwo: Team;
}

function selectIndex(cumProb: number[]): number {
  /*
   * Select a random index from a cumulative probability array cumProb
   */
  let rand = Math.random();

  for (let i = 0; i < cumProb.length; i++) {
    if (rand <= cumProb[i]) {
      return i;
    }
  }

  return cumProb.length - 1;
}

export function matchTeams(teams: Team[]): TeamPair[] {
  let team_pairs: TeamPair[] = [];

  teams.sort((a, b) => b.score - a.score);

  // Count is odd? Assign last team to BYE for this round
  if (teams.length % 2) {
    team_pairs.push({
      teamOne: teams.pop() ?? {id: -1, name: "", score: 0, played_against: []},
      teamTwo: {id: parseInt(process.env.BYE_ID ?? "0"), name: "BYE", score: 0, played_against: []},
    });
  }

  teams.forEach((team) => {
    team.modified_score = team.score;
  });

  while (true) {
    // pop the first team
    if (teams.length == 0) break;

    let currentTeam = teams.shift();
    if (!currentTeam) break;
    let opponentTeam: Team;

    let times_played_against: Record<number, number> = {};
    currentTeam.played_against.forEach((num) => {
      times_played_against[num] = (times_played_against[num] || 0) + 1;
    });

    teams.forEach((team) => {
      /*
       * TODO: Maybe add some increment (like 0.1) to all teams, so it becomes possible
       * for a team to match 0-scored team
       */
      team.modified_score = team.score;
      switch (times_played_against[team.id]) {
        case 0:
          break;
        case 1:
          team.modified_score *= 0.9;
          break;
        case 2:
          team.modified_score *= 0.8;
          break;
        case 3:
          team.modified_score *= 0.7;
          break;
        case 4:
          team.modified_score = 0;
          break;
        default:
          break;
      }
    });

    // for each team calculate the probability for selection
    let probs: number[] = Array<number>(teams.length).fill(0);
    let scores_sum = teams.reduce((sum, t) => sum + (t.modified_score ?? 0), 0);

    if (scores_sum == 0) {
      // first iteration (unless scores can be negative) -̣> return random opponent
      let idx = Math.ceil(Math.random() * teams.length) - 1;
      opponentTeam = teams.splice(idx, 1)[0];
    } else {
      /*
       * Probability calculation based on score function
       */
      probs[0] = (teams[0].modified_score ?? 0) / scores_sum;
      for (let i = 1; i < probs.length; i++) {
        probs[i] = probs[i - 1] + (teams[i].modified_score ?? 0) / scores_sum;
      }

      let idx = selectIndex(probs);
      opponentTeam = teams.splice(idx, 1)[0];
    }
    team_pairs.push({teamOne: currentTeam, teamTwo: opponentTeam});
  }

  return team_pairs;
}
