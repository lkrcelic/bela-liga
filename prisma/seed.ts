// prisma/seed.ts

import {PrismaClient} from "@prisma/client";
import {createMatch, createRandomPlayer, createRandomTeam} from "./seedHelpers";

const prisma = new PrismaClient();

async function main() {
  const player0 = await prisma.player.create({
    data: {
      username: "admin",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "zblabelatronika@example.com",
      player_role: "ADMIN",
      first_name: "Marko",
      last_name: "Blazevic",
      birth_year: 1996,
      city: "Saskatoon",
    },
  });

  const player1 = await prisma.player.create({
    data: {
      username: "player",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jane@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_year: 1992,
      city: "Los Angeles",
    },
  });

  const player2 = await prisma.player.create({
    data: {
      username: "johnny",
      password_hash: "securepassword",
      email: "johnny@example.com",
      player_role: "PLAYER",
      first_name: "Johnny",
      last_name: "Smith",
      birth_year: 1992,
      city: "New York",
    },
  });

  const player3 = await prisma.player.create({
    data: {
      username: "friendzone123",
      password_hash: "securepassword",
      email: "dsmith@example.com",
      player_role: "PLAYER",
      first_name: "De'Shaun",
      last_name: "Smith",
      birth_year: 1992,
      city: "Chicago",
    },
  });

  const player4 = await prisma.player.create({
    data: {
      username: "mistersister",
      password_hash: "securepassword",
      email: "brock@example.com",
      player_role: "PLAYER",
      first_name: "Brock",
      last_name: "Smith",
      birth_year: 1992,
      city: "Los Angeles",
    },
  });

  const player5 = await prisma.player.create({
    data: {
      username: "Jusufoh",
      password_hash: "securepassword",
      email: "jusufoh@example.com",
      player_role: "PLAYER",
      first_name: "Jusuf",
      last_name: "Palidza",
      birth_year: 1991,
      city: "Los Angeles",
    },
  });

  const player6 = await prisma.player.create({
    data: {
      username: "Huseinkapetangradasevic",
      password_hash: "securepassword",
      email: "huseineee@example.com",
      player_role: "PLAYER",
      first_name: "Husein",
      last_name: "Kapetan",
      birth_year: 1992,
      city: "Los Angeles",
    },
  });

  const player7 = await createRandomPlayer();
  const player8 = await createRandomPlayer();
  const player9 = await createRandomPlayer();
  const player10 = await createRandomPlayer();
  const player11 = await createRandomPlayer();
  const player12 = await createRandomPlayer();

  const teamBYE = await prisma.team.create({
    data: {
      team_id: 0,
      team_name: "BYE",
      creator_id: player0.id,
    },
  });

  const team1 = await prisma.team.create({
    data: {
      team_name: "Alen Kitasović",
      creator_id: player0.id,
      founder_id1: player1.id,
      founder_id2: player2.id,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      team_name: "Imotske Šarulje",
      creator_id: player0.id,
      founder_id1: player3.id,
      founder_id2: player4.id,
    },
  });

  const team3 = await prisma.team.create({
    data: {
      team_name: "Špicom u stomak",
      creator_id: player0.id,
      founder_id1: player5.id,
      founder_id2: player6.id,
    },
  });

  const team4 = await createRandomTeam(player0.id, player7.id, player8.id);
  const team5 = await createRandomTeam(player0.id, player9.id, player10.id);
  const team6 = await createRandomTeam(player0.id, player11.id, player12.id);

  const teamPlayers = [
    {team_id: team1.team_id, player_id: player1.id},
    {team_id: team1.team_id, player_id: player2.id},
    {team_id: team2.team_id, player_id: player3.id},
    {team_id: team2.team_id, player_id: player4.id},
    {team_id: team3.team_id, player_id: player5.id},
    {team_id: team3.team_id, player_id: player6.id},
    {team_id: team4.team_id, player_id: player7.id},
    {team_id: team4.team_id, player_id: player8.id},
    {team_id: team5.team_id, player_id: player9.id},
    {team_id: team5.team_id, player_id: player10.id},
    {team_id: team6.team_id, player_id: player11.id},
    {team_id: team6.team_id, player_id: player12.id},
  ];
  await prisma.teamPlayer.createMany({data: teamPlayers});

  const playerPairsData = [
    {player_id1: player1.id, player_id2: player2.id},
    {player_id1: player3.id, player_id2: player4.id},
    {player_id1: player5.id, player_id2: player6.id},
    {player_id1: player7.id, player_id2: player8.id},
    {player_id1: player9.id, player_id2: player10.id},
    {player_id1: player11.id, player_id2: player12.id},
  ];
  const playerPairs = await prisma.playerPair.createManyAndReturn({data: playerPairsData});

  const league = await prisma.league.create({
    data: {
      league_name: "Liga ljeta gospodnjeg 2024-2025",
      game_type: "TRESETA",
    },
  });
  const teams = [team1, team2, team3, team4, team5, team6];
  await prisma.leagueTeam.createMany({
    data: teams.map((team) => ({league_id: league.league_id, team_id: team.team_id})),
  });

  const roundsData = [
    {
      round_number: 1,
      round_date: new Date("2024-01-01"),
      team1_id: team1.team_id,
      team2_id: team2.team_id,
    },
    {
      round_number: 2,
      round_date: new Date("2024-01-02"),
      team1_id: team1.team_id,
      team2_id: team2.team_id,
    },
    {
      round_number: 3,
      round_date: new Date("2024-02-01"),
      team1_id: team3.team_id,
      team2_id: team1.team_id,
    },
    {
      round_number: 1,
      round_date: new Date("2024-01-01"),
      team1_id: team5.team_id,
      team2_id: team6.team_id,
    },
  ];
  const rounds = await prisma.round.createManyAndReturn({data: roundsData});

  const leagueRounds = [
    {league_id: league.league_id, round_id: rounds[0].id},
    {league_id: league.league_id, round_id: rounds[1].id},
    {league_id: league.league_id, round_id: rounds[2].id},
    {league_id: league.league_id, round_id: rounds[3].id},
  ];
  await prisma.leagueRound.createMany({data: leagueRounds});

  // create matches for each round!
  const match1 = await createMatch(rounds[0].id, playerPairs[0].id, playerPairs[1].id, true);
  const match2 = await createMatch(rounds[0].id, playerPairs[0].id, playerPairs[1].id, false);

  const match3 = await createMatch(rounds[1].id, playerPairs[0].id, playerPairs[1].id, true);
  const match4 = await createMatch(rounds[1].id, playerPairs[0].id, playerPairs[0].id, true);

  const match5 = await createMatch(rounds[2].id, playerPairs[0].id, playerPairs[1].id, false);
  const match6 = await createMatch(rounds[2].id, playerPairs[0].id, playerPairs[1].id, false);

  let teamScores = [
    {team_id: team1.team_id, league_id: league.league_id, score: 4},
    {team_id: team2.team_id, league_id: league.league_id, score: 4},
    {team_id: team3.team_id, league_id: league.league_id, score: 1},
  ];
  await prisma.teamScore.createMany({data: teamScores});

  const match7 = await createMatch(null, playerPairs[0].id, playerPairs[1].id, true);
  const match8 = await createMatch(rounds[3].id, playerPairs[4].id, playerPairs[5].id, true);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
