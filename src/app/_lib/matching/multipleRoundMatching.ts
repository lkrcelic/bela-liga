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
 * Checks if two teams have played against each other in the current execution
 */
function haveTeamsPlayedInCurrentExecution(teamA: Team, teamB: Team): boolean {
  return teamA.current_execution_played_against.includes(teamB.id) || 
         teamB.current_execution_played_against.includes(teamA.id);
}

/**
 * Calculates a cost matrix for all possible pairings in a window
 * Lower cost means better pairing (fewer previous matchups)
 */
function calculateCostMatrix(teams: Team[]): number[][] {
  const n = teams.length;
  const costMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // First check if teams have played in current execution
      if (haveTeamsPlayedInCurrentExecution(teams[i], teams[j])) {
        // Very high cost for teams that have already played in this execution
        // But not Infinity, to allow for repeat matchups as a last resort
        costMatrix[i][j] = 10000;
        costMatrix[j][i] = 10000;
        continue;
      }
      
      // Count previous matchups between teams[i] and teams[j]
      const matchupCount = countMatchups(teams[i], teams[j]);
      
      // Set cost based on number of previous matchups (higher count = higher cost)
      // Use a high penalty for repeat matchups
      const cost = matchupCount === 0 ? 1 : 100 * matchupCount;
      
      costMatrix[i][j] = cost;
      costMatrix[j][i] = cost; // Matrix is symmetric
    }
  }
  
  return costMatrix;
}

/**
 * Find minimum weight perfect matching using a more global approach
 * This is an improved version that tries to minimize the total cost across all pairings
 */
function findOptimalPairings(teams: Team[], costMatrix: number[][]): TeamPair[] {
  const n = teams.length;
  
  // Create a working copy of the cost matrix
  const workingMatrix = costMatrix.map(row => [...row]);
  const pairs: TeamPair[] = [];
  const paired = new Set<number>();
  
  // Repeat until all teams are paired
  while (paired.size < n) {
    let minCost = Infinity;
    let bestPair: [number, number] | null = null;
    
    // Find the global minimum cost pairing among all remaining teams
    for (let i = 0; i < n; i++) {
      if (paired.has(i)) continue;
      
      for (let j = i + 1; j < n; j++) {
        if (paired.has(j)) continue;
        
        if (workingMatrix[i][j] < minCost) {
          minCost = workingMatrix[i][j];
          bestPair = [i, j];
        }
      }
    }
    
    // If we found a valid pair, add it
    if (bestPair) {
      const [i, j] = bestPair;
      pairs.push({ teamOne: teams[i], teamTwo: teams[j] });
      paired.add(i);
      paired.add(j);
      
      // Mark these pairs as unavailable by setting their costs to Infinity
      for (let k = 0; k < n; k++) {
        workingMatrix[i][k] = Infinity;
        workingMatrix[k][i] = Infinity;
        workingMatrix[j][k] = Infinity;
        workingMatrix[k][j] = Infinity;
      }
    } else {
      // This should not happen if the algorithm is working correctly
      // and there are an even number of teams
      console.error("Could not find a valid pairing");
      break;
    }
  }
  
  return pairs;
}

/**
 * Creates pairings for a single window of teams for a specific round
 * using a global optimization approach
 */
function createOptimalWindowPairings(windowTeams: Team[]): TeamPair[] {
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
    const costMatrix = calculateCostMatrix(availableTeams);
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
  
  for (let round = 0; round < numberOfRounds; round++) {
    const roundPairings: TeamPair[] = [];
    
    for (const window of windows) {
      const windowPairings = createOptimalWindowPairings(window);
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
