export interface Team {
  readonly id: number;
  readonly name: string;
  readonly point_difference: number;
  readonly score: number;
  modified_score?: number | null | undefined;
  played_against: number[]; // ids of teams already played against!
  current_execution_played_against?: number[]; // teams played against in this execution
}

export interface TeamPair {
  teamOne: Team;
  teamTwo: Team;
}

export interface MultiRoundMatchingOptions {
  windowSize: number;
  numberOfRounds: number;
}

/**
 * Creates a bye team
 */
function createByeTeam(): Team {
  return {
    id: parseInt(process.env.BYE_ID ?? "0"), 
    name: "bye", 
    score: 0, 
    point_difference: 0,
    played_against: []
  };
}

/**
 * Divides teams into windows based on score and window size
 */
function divideTeamsIntoWindows(teams: Team[], windowSize: number, numberOfRounds: number): Team[][] {
  // Sort teams by score (descending) and then by point difference (descending)
  const sortedTeams = [...teams].sort((a, b) => 
    a.score === b.score ? b.point_difference - a.point_difference : b.score - a.score
  );
  
  const windows: Team[][] = [];
  for (let i = 0; i < sortedTeams.length; i += windowSize) {
    windows.push(sortedTeams.slice(i, i + windowSize));
  }
  
  // Handle the last window if it's smaller than the window size
  // Consider merging if the last window is too small compared to the number of rounds
  if (windows.length > 1 && windows[windows.length - 1].length < Math.max(windowSize / 2, numberOfRounds)) { 
    const lastWindow = windows.pop();
    if (lastWindow) {
      windows[windows.length - 1] = [...windows[windows.length - 1], ...lastWindow];
    }
  }
  
  return windows;
}

/**
 * Counts how many times two teams have played against each other
 */
function countMatchups(teamA: Team, teamB: Team): number {
  let count = 0;
  for (const id of teamA.played_against) {
    if (id === teamB.id) count++;
  }
  return count;
}

/**
 * Checks if teams have played together in the current round matching
 * Returns true if teams have played, false otherwise
 */
function haveTeamsPlayedTogetherInThisRoundMatching(teamA: Team, teamB: Team, round: number): boolean {
  // If we're in the first round, teams haven't played in this execution
  if (round <= 1) return false;
  
  // Get the relevant portion of the played_against array for the current round
  // We only want to look at matches from the current round-making process
  // Slice from the end of the array since that's where new matches are pushed
  const relevantMatches = teamA.current_execution_played_against.slice(-1 * (round - 1));

  // Check if teamB's ID is in the relevant matches
  return relevantMatches.includes(teamB.id);
}

/**
 * Calculates a cost matrix for all possible pairings in a window
 * Optimized to skip calculations for teams that have already played together
 * Only calculates upper triangle of the matrix since it's symmetrical
 */
function calculateCostMatrix(teams: Team[], round: number): number[][] {
  const n = teams.length;
  // Initialize all costs to Infinity (invalid by default)
  const costMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(Infinity));
  
  // Only calculate costs for valid pairings (upper triangle only)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Skip teams that have already played together in this execution
      const havePlayed = haveTeamsPlayedTogetherInThisRoundMatching(teams[i], teams[j], round);
      if (havePlayed) {
        continue;
      }
      
      // Calculate cost based on historical matchups
      const matchupCount = countMatchups(teams[i], teams[j]);
      // Only set the upper triangle
      costMatrix[i][j] = matchupCount === 0 ? 0 : 10 * matchupCount;
    }
  }
  
  return costMatrix;
}

/**
 * Find a good matching using a greedy approach with retry mechanism
 * This approach is much faster than the exhaustive search while still producing good results
 */
function findOptimalPairings(teams: Team[], costMatrix: number[][]): TeamPair[] {
  const n = teams.length;
  const MAX_RETRIES = 100; // Maximum number of retries to find a valid pairing
  
  // Function to find a greedy matching
  function findGreedyMatching(): number[][] | null {
    // Create a copy of the cost matrix to modify during the algorithm
    const workingCostMatrix = costMatrix.map(row => [...row]);
    const available = new Set<number>();
    for (let i = 0; i < n; i++) {
      available.add(i);
    }
    
    const matching: number[][] = [];
    
    // While there are still teams to match
    while (available.size >= 2) {
      let minCost = Infinity;
      let bestPair: [number, number] | null = null;
      
      // Find the pair with the lowest cost among available teams
      const availableArray = Array.from(available);
      for (let i = 0; i < availableArray.length; i++) {
        for (let j = i + 1; j < availableArray.length; j++) {
          const team1 = availableArray[i];
          const team2 = availableArray[j];
          
          // Always use the upper triangle (i < j)
          const a = Math.min(team1, team2);
          const b = Math.max(team1, team2);
          
          const cost = workingCostMatrix[a][b];
          if (isFinite(cost) && cost < minCost) {
            minCost = cost;
            bestPair = [team1, team2];
          }
        }
      }
      
      // If no valid pair found, the matching is invalid
      if (!bestPair) {
        return null;
      }
      
      // Add the best pair to the matching and remove from available
      matching.push(bestPair);
      available.delete(bestPair[0]);
      available.delete(bestPair[1]);
    }
    
    // If there's one team left, it can't be matched
    if (available.size === 1) {
      return null;
    }
    
    return matching;
  }
  
  // Try to find a valid matching with retries
  let matching: number[][] | null = null;
  let retries = 0;
  
  while (!matching && retries < MAX_RETRIES) {
    matching = findGreedyMatching();
    
    if (!matching) {
      // If no valid matching found, slightly perturb the cost matrix and try again
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (isFinite(costMatrix[i][j])) {
            // Add small random noise to break ties differently
            costMatrix[i][j] += Math.random() * 0.1;
          }
        }
      }
      retries++;
    }
  }
  
  // Convert the matching to TeamPair objects
  const pairs: TeamPair[] = [];
  if (matching) {
    for (const [i, j] of matching) {
      pairs.push({ teamOne: teams[i], teamTwo: teams[j] });
    }
  }
  
  return pairs;
}

/**
 * Creates pairings for a single window of teams for a specific round
 * using a global optimization approach
 */
function createOptimalWindowPairings(windowTeams: Team[], round: number): TeamPair[] {
  const pairs: TeamPair[] = [];
  const availableTeams = [...windowTeams];
  
  // Handle odd number of teams - give bye to the lowest scoring team
  if (availableTeams.length % 2 !== 0) {
    // Check if any team already has a bye (in played_against)
    const teamsWithoutBye = availableTeams.filter(
      team => !team.played_against.includes(parseInt(process.env.BYE_ID ?? "0"))
    );
    
    // If there are teams without a bye, give the bye to the lowest scoring one
    const byeTeamIndex = teamsWithoutBye.length > 0 
      ? availableTeams.findIndex(t => t.id === teamsWithoutBye[0].id)
      : 0;
    
    const byeTeam = availableTeams.splice(byeTeamIndex, 1)[0];
    pairs.push({ teamOne: byeTeam, teamTwo: createByeTeam() });
  }
  
  // Calculate cost matrix for remaining teams
  if (availableTeams.length > 0) {
    const costMatrix = calculateCostMatrix(availableTeams, round);
    const optimalPairs = findOptimalPairings(availableTeams, costMatrix);
    pairs.push(...optimalPairs);
  }
  
  return pairs;
}

/**
 * Updates the played_against arrays for all teams based on the pairings
 * Also updates the current_execution_played_against array to track matchups within this execution
 */
function updatePlayedAgainst(teams: Team[], pairings: TeamPair[]): Team[] {
  const updatedTeams = [...teams];
  
  for (const pair of pairings) {
    // Skip bye teams
    if (pair.teamTwo.name.toLowerCase() === 'bye') {
      const teamOne = updatedTeams.find(t => t.id === pair.teamOne.id);
      if (teamOne) {
        teamOne.played_against = [...teamOne.played_against, pair.teamTwo.id];
        teamOne.current_execution_played_against.push(pair.teamTwo.id);
      }
      continue;
    }
    
    const teamOne = updatedTeams.find(t => t.id === pair.teamOne.id);
    const teamTwo = updatedTeams.find(t => t.id === pair.teamTwo.id);
    
    if (teamOne && teamTwo) {
      // Update the global played_against array
      teamOne.played_against.push(teamTwo.id);
      teamTwo.played_against.push(teamOne.id);
      
      // Update the current execution played_against array
      teamOne.current_execution_played_against.push(teamTwo.id);
      teamTwo.current_execution_played_against.push(teamOne.id);
    }
  }
  
  return updatedTeams;
}

/**
 * Initializes the current_execution_played_against array for all teams
 */
function initializeCurrentExecutionTracking(teams: Team[]): Team[] {
  return teams.map(team => ({
    ...team,
    current_execution_played_against: []
  }));
}

/**
 * Generates pairings for multiple rounds
 */
export function generateMultipleRoundPairings(
  teams: Team[], 
  options: MultiRoundMatchingOptions
): TeamPair[][] {
  const { windowSize, numberOfRounds } = options;
  const allRoundPairings: TeamPair[][] = [];
  
  // Initialize teams with current_execution_played_against array
  let currentTeams = initializeCurrentExecutionTracking([...teams]);
  const windows = divideTeamsIntoWindows(currentTeams, windowSize, numberOfRounds);
  
  for (let round = 1; round <= numberOfRounds; round++) {
    const roundPairings: TeamPair[] = [];
    
    for (const window of windows) {
      const windowPairings = createOptimalWindowPairings(window, round);
      roundPairings.push(...windowPairings);
    }
    
    // Move bye pair to the end
    const byeIndex = roundPairings.findIndex(pair => pair.teamTwo.name.toLowerCase() === 'bye');
    if (byeIndex !== -1) {
      const byePair = roundPairings.splice(byeIndex, 1)[0];
      roundPairings.push(byePair);
    }
    
    allRoundPairings.push(roundPairings);
    
    // Update played_against for next round
    currentTeams = updatePlayedAgainst(currentTeams, roundPairings);
  }
  
  return allRoundPairings;
}

/**
 * Legacy function for backward compatibility
 * Matches teams for a single round
 */
export function matchTeams(teams: Team[]): TeamPair[] {
  // Use the new system with default values
  const options: MultiRoundMatchingOptions = {
    windowSize: Math.max(Math.floor(teams.length / 8), 2),
    numberOfRounds: 1
  };
  
  const allRoundPairings = generateMultipleRoundPairings(teams, options);
  return allRoundPairings[0] || [];
}
