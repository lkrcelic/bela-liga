// belotRating.ts
// Glicko-2 (lite) sustav za 2v2 timove – TypeScript verzija by GPT
// Bazirano na tvojoj Python implementaciji

export interface Player {
    name: string;
    rating: number; // R
    rd: number;     // Rating Deviation
    sigma: number;  // Volatility
  }
  
  const MU0 = 1500;
  const PHI0 = 350;
  const SIGMA0 = 0.06;
  const TAU = 0.5;
  const Q = Math.log(10) / 400;
  const SCALE = 16; // pojačanje promjene
  
  function g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * Q * Q * phi * phi) / (Math.PI * Math.PI));
  }
  
  function E(mu: number, mu_j: number, phi_j: number): number {
    return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));
  }
  
  function toGlicko2(p: Player): [number, number, number] {
    const mu = (p.rating - 1500) / 173.7178;
    const phi = p.rd / 173.7178;
    return [mu, phi, p.sigma];
  }
  
  function fromGlicko2(mu: number, phi: number, sigma: number): Player {
    return {
      name: "",
      rating: mu * 173.7178 + 1500,
      rd: phi * 173.7178,
      sigma
    };
  }
  
  // Lite Glicko-2 bez iteracije volatilnosti
  function updateSingle(mu: number, phi: number, sigma: number, muOpp: number, phiOpp: number, s: number) {
    const gVal = g(phiOpp);
    const EVal = 1 / (1 + Math.exp(-gVal * (mu - muOpp)));
    const v = 1 / (Q * Q * gVal * gVal * EVal * (1 - EVal));
    const phiStar = Math.sqrt(phi * phi + sigma * sigma);
    const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const muPrime = mu + phiPrime * phiPrime * Q * gVal * (s - EVal);
    return [muPrime, phiPrime, sigma];
  }
  
  // Glavna klasa sustava
  export class RatingSystem {
    players: Record<string, Player>;
  
    constructor() {
      this.players = {};
    }
  
    addPlayer(name: string) {
      if (!this.players[name]) {
        this.players[name] = { name, rating: MU0, rd: PHI0, sigma: SIGMA0 };
      }
    }
  
    get(name: string): Player {
      if (!this.players[name]) this.addPlayer(name);
      return this.players[name];
    }
  
    rateTeamMatch(teamA: string[], teamB: string[], sA: number) {
      if (sA < 0 || sA > 1) throw new Error("Rezultat mora biti između 0 i 1.");
      for (const name of [...teamA, ...teamB]) this.addPlayer(name);
  
      // izračun prosjeka timova
      const gA = teamA.map(n => toGlicko2(this.players[n]));
      const gB = teamB.map(n => toGlicko2(this.players[n]));
  
      const muA = (gA[0][0] + gA[1][0]) / 2;
      const phiA = (gA[0][1] + gA[1][1]) / 2;
      const muB = (gB[0][0] + gB[1][0]) / 2;
      const phiB = (gB[0][1] + gB[1][1]) / 2;
  
      // nova stanja
      const [muAnew, phiAnew, sigmaA] = updateSingle(muA, phiA, SIGMA0, muB, phiB, sA);
      const [muBnew, phiBnew, sigmaB] = updateSingle(muB, phiB, SIGMA0, muA, phiA, 1 - sA);
  
      const dmuA = (muAnew - muA) * SCALE;
      const dmuB = (muBnew - muB) * SCALE;
  
      // ažuriraj igrače
      for (const name of teamA) {
        const p = this.players[name];
        const [mu, phi, sigma] = toGlicko2(p);
        const newP = fromGlicko2(mu + dmuA, phiAnew, sigmaA);
        p.rating = newP.rating;
        p.rd = newP.rd;
        p.sigma = newP.sigma;
      }
  
      for (const name of teamB) {
        const p = this.players[name];
        const [mu, phi, sigma] = toGlicko2(p);
        const newP = fromGlicko2(mu + dmuB, phiBnew, sigmaB);
        p.rating = newP.rating;
        p.rd = newP.rd;
        p.sigma = newP.sigma;
      }
    }
  
    getTable(): Player[] {
      return Object.values(this.players).sort((a, b) => b.rating - a.rating);
    }
  }
  