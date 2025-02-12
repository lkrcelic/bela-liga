export interface Team {
  readonly id: number;
  readonly name: string;
  readonly point_difference: number;
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
  const rand = Math.random();

  for (let i = 0; i < cumProb.length; i++) {
    if (rand <= cumProb[i]) {
      return i;
    }
  }

  return cumProb.length - 1;
}

export function matchTeams(teams: Team[]): TeamPair[] {
  const team_pairs: TeamPair[] = [];
  const startingTeamsLength = teams.length;

  teams.sort((a, b) => b.score - a.score);

  // Count is odd? Assign last team to BYE for this round
  if (teams.length % 2) {
    team_pairs.push({
      teamOne: teams.pop(),
      teamTwo: {id: parseInt(process.env.BYE_ID ?? "0"), name: "bye", score: 0, played_against: []},
    });
  }

  teams.forEach((team) => {
    team.modified_score = team.score;
  });

  while (true) {
    // pop the first team
    if (teams.length == 0) break;

    const currentTeam = teams.shift();
    if (!currentTeam) break;
    let opponentTeam: Team;

    const times_played_against: Record<number, number> = {};
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
          team.modified_score *= 0.5;
          break;
        case 2:
          team.modified_score *= 0.4;
          break;
        case 3:
          team.modified_score *= 0.3;
          break;
        case 4:
          team.modified_score = 0.2;
          break;
        case 5:
          team.modified_score = 0.1;
          break;
        case 6:
          team.modified_score = 0;
          break;
        default:
          break;
      }
    });

    const sortedTeams = teams.slice().sort((a, b) => (b.modified_score ?? 0) - (a.modified_score ?? 0));

    // Limit the selection to only the top 1/4 of teams or 4 teams (or remaining teams if fewer exist)
    const selectionPool = sortedTeams.slice(0, Math.max(4, startingTeamsLength / 4));

    // Calculate cumulative probability only for these top 5 teams
    const scores_sum = selectionPool.reduce((sum, t) => sum + (t.modified_score ?? 0), 0);
    const probs: number[] = new Array(selectionPool.length).fill(0);

    if (scores_sum === 0) {
      // If all scores are 0, pick a random team from the selection pool
      const idx = Math.floor(Math.random() * selectionPool.length);
      opponentTeam = selectionPool.splice(idx, 1)[0];
    } else {
      // Compute cumulative probability for the top teams
      probs[0] = (selectionPool[0].modified_score ?? 0) / scores_sum;
      for (let i = 1; i < selectionPool.length; i++) {
        probs[i] = probs[i - 1] + (selectionPool[i].modified_score ?? 0) / scores_sum;
      }

      // Select opponent from the top using weighted random selection
      const idx = selectIndex(probs);
      opponentTeam = selectionPool.splice(idx, 1)[0];
    }

    // Remove the selected opponent from the original team list
    const removeIndex = teams.findIndex(t => t.id === opponentTeam.id);
    teams.splice(removeIndex, 1);

    team_pairs.push({teamOne: currentTeam, teamTwo: opponentTeam});
  }

  if (team_pairs.length > 0 && team_pairs[0].teamTwo.name.toLowerCase() === 'bye') {
    const firstPair = team_pairs.shift();
    if (firstPair) { // shift returns undefined if the array is empty
      team_pairs.push(firstPair);
    }
  }

  return team_pairs;
}
