// ratingService.ts
// Glicko-2 Rating System for Belot 2v2 matches
// Integrated with Prisma database

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Glicko-2 Constants
const MU0 = 1500;      // Starting rating
const PHI0 = 350;      // Starting rating deviation
const MIN_PHI = 100;   // Minimum rating deviation
const SIGMA0 = 0.06;   // Starting volatility
// const TAU = 0.5;       // System constant (reserved for future use)
const Q = Math.log(10) / 400;
const SCALE = 16;

// Helper function: RD impact
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * Q * Q * phi * phi) / (Math.PI * Math.PI));
}

// Helper function: Expected score (reserved for future use)
// function E(mu: number, mu_j: number, phi_j: number): number {
//   return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
// }

// Convert from Glicko to Glicko-2 scale
function toGlicko2(rating: number, rd: number, sigma: number): [number, number, number] {
  const mu = (rating - 1500) / 173.7178;
  const phi = rd / 173.7178;
  return [mu, phi, sigma];
}

// Convert from Glicko-2 to Glicko scale
function fromGlicko2(mu: number, phi: number, sigma: number): [number, number, number] {
  return [
    mu * 173.7178 + 1500,  // rating
    phi * 173.7178,        // rd
    sigma                  // volatility
  ];
}

// Simplified rating update - no time decay, fixed RD reduction
function updateSingle(
  mu: number,
  phi: number,
  sigma: number,
  muOpp: number,
  phiOpp: number,
  s: number
): [number, number, number] {
  const gVal = g(phiOpp);
  const EVal = 1 / (1 + Math.exp(-gVal * (mu - muOpp)));
  
  // Calculate rating change
  const K = Q * phi * gVal;  // Simplified K-factor based on RD
  const muPrime = mu + K * (s - EVal);
  
  // Fixed RD reduction per match (decreases by ~5% per match)
  if (phi * 173.7178 > MIN_PHI) {
    phi = phi * 0.98;
  }
  
  return [muPrime, phi, sigma];
}

// 2v2 update: treat as team vs team, then apply to individuals
function update2v2(
  playersA: Array<{ rating: number; rd: number; vol: number }>,
  playersB: Array<{ rating: number; rd: number; vol: number }>,
  scoreA: number
): { teamA: Array<{ rating: number; rd: number; vol: number }>; teamB: Array<{ rating: number; rd: number; vol: number }> } {
  // Convert to Glicko-2 scale
  const gA = playersA.map(p => toGlicko2(p.rating, p.rd, p.vol));
  const gB = playersB.map(p => toGlicko2(p.rating, p.rd, p.vol));

  // Calculate team averages
  const muA = (gA[0][0] + gA[1][0]) / 2;
  const phiA = (gA[0][1] + gA[1][1]) / 2;
  const muB = (gB[0][0] + gB[1][0]) / 2;
  const phiB = (gB[0][1] + gB[1][1]) / 2;

  // Update team ratings
  const [muAnew, phiAnew, sigmaA] = updateSingle(muA, phiA, SIGMA0, muB, phiB, scoreA);
  const [muBnew, phiBnew, sigmaB] = updateSingle(muB, phiB, SIGMA0, muA, phiA, 1 - scoreA);

  // Calculate rating changes
  const dmuA = (muAnew - muA) * SCALE;
  const dmuB = (muBnew - muB) * SCALE;

  // Update team A players
  const updA = gA.map(([mu]) => {
    const [newRating, newRd, newSigma] = fromGlicko2(mu + dmuA, phiAnew, sigmaA);
    return { rating: Math.round(newRating), rd: newRd, vol: newSigma };
  });

  // Update team B players
  const updB = gB.map(([mu]) => {
    const [newRating, newRd, newSigma] = fromGlicko2(mu + dmuB, phiBnew, sigmaB);
    return { rating: Math.round(newRating), rd: newRd, vol: newSigma };
  });

  return { teamA: updA, teamB: updB };
}

/**
 * Update player ratings after a 2v2 match
 * @param teamAPlayerIds Array of 2 player IDs for team A
 * @param teamBPlayerIds Array of 2 player IDs for team B
 * @param scoreA Result for team A (1 = win, 0.5 = draw, 0 = loss)
 */
export async function updateRatingsAfterMatch(
  teamAPlayerIds: number[],
  teamBPlayerIds: number[],
  scoreA: number
): Promise<void> {
  if (teamAPlayerIds.length !== 2 || teamBPlayerIds.length !== 2) {
    throw new Error("Each team must have exactly 2 players");
  }
  if (scoreA < 0 || scoreA > 1) {
    throw new Error("Score must be between 0 and 1 (0=loss, 0.5=draw, 1=win)");
  }

  // Fetch all players
  const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds];
  const players = await prisma.player.findMany({
    where: { id: { in: allPlayerIds } },
    select: { id: true, rating: true, rating_deviation: true, volatility: true }
  });

  if (players.length !== 4) {
    throw new Error("Could not find all players in database");
  }

  // Map players to teams
  const teamAPlayers = players.filter(p => teamAPlayerIds.includes(p.id));
  const teamBPlayers = players.filter(p => teamBPlayerIds.includes(p.id));

  // Prepare player data for update2v2
  const playersA = teamAPlayers.map(p => ({
    rating: p.rating,
    rd: p.rating_deviation,
    vol: p.volatility
  }));
  const playersB = teamBPlayers.map(p => ({
    rating: p.rating,
    rd: p.rating_deviation,
    vol: p.volatility
  }));

  // Calculate new ratings using update2v2
  const { teamA: updatedA, teamB: updatedB } = update2v2(playersA, playersB, scoreA);

  // Update team A players in database
  for (let i = 0; i < teamAPlayers.length; i++) {
    const player = teamAPlayers[i];
    const updated = updatedA[i];

    await prisma.player.update({
      where: { id: player.id },
      data: {
        rating: updated.rating,
        rating_deviation: updated.rd,
        volatility: updated.vol
      }
    });
  }

  // Update team B players in database
  for (let i = 0; i < teamBPlayers.length; i++) {
    const player = teamBPlayers[i];
    const updated = updatedB[i];

    await prisma.player.update({
      where: { id: player.id },
      data: {
        rating: updated.rating,
        rating_deviation: updated.rd,
        volatility: updated.vol
      }
    });
  }
}

/**
 * Get leaderboard sorted by rating
 * @param limit Number of players to return (default: 50)
 */
export async function getLeaderboard(limit: number = 50) {
  return await prisma.player.findMany({
    select: {
      id: true,
      username: true,
      first_name: true,
      last_name: true,
      rating: true,
      rating_deviation: true,
      volatility: true
    },
    orderBy: { rating: 'desc' },
    take: limit
  });
}

/**
 * Reset a player's rating to default values
 */
export async function resetPlayerRating(playerId: number) {
  return await prisma.player.update({
    where: { id: playerId },
    data: {
      rating: MU0,
      rating_deviation: PHI0,
      volatility: SIGMA0
    }
  });
}

/**
 * Get player rating info
 */
export async function getPlayerRating(playerId: number) {
  return await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      username: true,
      rating: true,
      rating_deviation: true,
      volatility: true
    }
  });
}
