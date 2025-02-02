// prisma/seed.ts

import {PrismaClient} from "@prisma/client";

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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
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
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player7 = await prisma.player.create({
    data: {
      username: "Mujo",
      password_hash: "securepassword",
      email: "huseineee1@example.com",
      player_role: "PLAYER",
      first_name: "Muje",
      last_name: "Mujic",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player8 = await prisma.player.create({
    data: {
      username: "Haso",
      password_hash: "securepassword",
      email: "huseineee2@example.com",
      player_role: "PLAYER",
      first_name: "Haso",
      last_name: "Hasic",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player9 = await prisma.player.create({
    data: {
      username: "Magud",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jan3e@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player10 = await prisma.player.create({
    data: {
      username: "Nera",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jan4e@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player11 = await prisma.player.create({
    data: {
      username: "Marić",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jan5@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player12 = await prisma.player.create({
    data: {
      username: "Josipović",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jan6e@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player13 = await prisma.player.create({
    data: {
      username: "Raguz",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jane7@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player14 = await prisma.player.create({
    data: {
      username: "Curic",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jane8@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player15 = await prisma.player.create({
    data: {
      username: "Vid",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jane9@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
    },
  });

  const player16 = await prisma.player.create({
    data: {
      username: "Roko",
      // password is 'sifra'
      password_hash:
        "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
      email: "jane10@example.com",
      player_role: "PLAYER",
      first_name: "Jane",
      last_name: "Smith",
      birth_date: "2000-01-15T00:00:00.000Z",
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

  const team4 = await prisma.team.create({
    data: {
      team_name: "Mujo i Haso",
      creator_id: player0.id,
      founder_id1: player7.id,
      founder_id2: player8.id,
    },
  });

  const team5 = await prisma.team.create({
    data: {
      team_name: "Barcelona",
      creator_id: player0.id,
      founder_id1: player9.id,
      founder_id2: player10.id,
    },
  });

  const team6 = await prisma.team.create({
    data: {
      team_name: "Dubec kartel",
      creator_id: player0.id,
      founder_id1: player11.id,
      founder_id2: player12.id,
    },
  });

  const team7 = await prisma.team.create({
    data: {
      team_name: "Astletičari",
      creator_id: player0.id,
      founder_id1: player13.id,
      founder_id2: player14.id,
    },
  });

  const team8 = await prisma.team.create({
    data: {
      team_name: "Lavovi",
      creator_id: player0.id,
      founder_id1: player15.id,
      founder_id2: player16.id,
    },
  });

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
    {team_id: team7.team_id, player_id: player13.id},
    {team_id: team7.team_id, player_id: player14.id},
    {team_id: team8.team_id, player_id: player15.id},
    {team_id: team8.team_id, player_id: player16.id},
  ];
  await prisma.teamPlayer.createMany({data: teamPlayers});


  const league = await prisma.league.create({
    data: {
      league_name: "Liga ljeta gospodnjeg 2024-2025",
      game_type: "TRESETA",
    },
  });
  const teams = [team1, team2, team3, team4, team5, team6, team7, team8];
  await prisma.leagueTeam.createMany({
    data: teams.map((team) => ({league_id: league.league_id, team_id: team.team_id})),
  });
  /*
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
  */
  const leagueTeams = await prisma.leagueTeam.findMany({
    select: {
      team_id: true,
      league_id: true,
    },
  });

  for (const {team_id, league_id} of leagueTeams) {
    await prisma.$queryRaw`
      CALL update_team_score(${team_id}, ${league_id})
    `;
  }

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
