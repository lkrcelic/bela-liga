// ratingService.ts
// Glicko-2 based rating system for Bela team rounds
// Integrated with Prisma database

import { Prisma } from "@prisma/client";
import { prisma } from "@/app/_lib/prisma";

// Glicko-2 Constants
export const MU0 = 1500;      // Starting rating
export const PHI0 = 350;      // Starting rating deviation
const MIN_PHI = 100;   // Minimum rating deviation
export const SIGMA0 = 0.06;   // Starting volatility
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

type PlayerRating = { rating: number; rd: number; vol: number };

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Team vs team update: each team plays as its average rating and RD, the team's rating change is applied to every
// player, and each player keeps their own RD (shrunk a little per round) and volatility.
// Works for any roster size, since teams can have substitutes.
export function updateTeams(
  playersA: PlayerRating[],
  playersB: PlayerRating[],
  scoreA: number
): { teamA: PlayerRating[]; teamB: PlayerRating[] } {
  // Convert to Glicko-2 scale
  const gA = playersA.map(p => toGlicko2(p.rating, p.rd, p.vol));
  const gB = playersB.map(p => toGlicko2(p.rating, p.rd, p.vol));

  // Calculate team averages
  const muA = average(gA.map(([mu]) => mu));
  const phiA = average(gA.map(([, phi]) => phi));
  const muB = average(gB.map(([mu]) => mu));
  const phiB = average(gB.map(([, phi]) => phi));

  // Update team ratings
  const [muAnew] = updateSingle(muA, phiA, SIGMA0, muB, phiB, scoreA);
  const [muBnew] = updateSingle(muB, phiB, SIGMA0, muA, phiA, 1 - scoreA);

  // Calculate rating changes
  const dmuA = (muAnew - muA) * SCALE;
  const dmuB = (muBnew - muB) * SCALE;

  const applyChange = (dmu: number) => ([mu, phi, sigma]: [number, number, number]): PlayerRating => {
    const newPhi = phi * 173.7178 > MIN_PHI ? phi * 0.98 : phi;
    const [newRating, newRd, newSigma] = fromGlicko2(mu + dmu, newPhi, sigma);
    // rating is stored as an integer
    return { rating: Math.round(newRating), rd: newRd, vol: newSigma };
  };

  return { teamA: gA.map(applyChange(dmuA)), teamB: gB.map(applyChange(dmuB)) };
}

/**
 * Update player ratings after a round between two teams
 * @param teamAPlayerIds Player IDs of team A (its whole roster)
 * @param teamBPlayerIds Player IDs of team B (its whole roster)
 * @param scoreA Result for team A (1 = win, 0.5 = draw, 0 = loss)
 * @param db Prisma client or transaction to write with
 */
export async function updateRatingsAfterMatch(
  teamAPlayerIds: number[],
  teamBPlayerIds: number[],
  scoreA: number,
  db: Prisma.TransactionClient = prisma
): Promise<void> {
  if (teamAPlayerIds.length === 0 || teamBPlayerIds.length === 0) {
    throw new Error("Each team needs at least one player");
  }
  if (scoreA < 0 || scoreA > 1) {
    throw new Error("Score must be between 0 and 1 (0=loss, 0.5=draw, 1=win)");
  }

  // Fetch all players
  const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds];
  const players = await db.player.findMany({
    where: { id: { in: allPlayerIds } },
    select: { id: true, rating: true, rating_deviation: true, volatility: true }
  });

  // Map players to teams
  const teamAPlayers = players.filter(p => teamAPlayerIds.includes(p.id));
  const teamBPlayers = players.filter(p => teamBPlayerIds.includes(p.id));
  if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
    throw new Error("Could not find the players in database");
  }

  const toRating = (p: typeof players[number]): PlayerRating => ({
    rating: p.rating,
    rd: p.rating_deviation,
    vol: p.volatility
  });

  const { teamA: updatedA, teamB: updatedB } = updateTeams(teamAPlayers.map(toRating), teamBPlayers.map(toRating), scoreA);

  const updates = [
    ...teamAPlayers.map((player, i) => ({ id: player.id, updated: updatedA[i] })),
    ...teamBPlayers.map((player, i) => ({ id: player.id, updated: updatedB[i] })),
  ];
  for (const { id, updated } of updates) {
    await db.player.update({
      where: { id },
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
