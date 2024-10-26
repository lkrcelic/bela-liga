// prisma/seed.ts

import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const player0 = await prisma.player.create({
        data: {
            username: "admin",
            // password is 'sifra'
            password_hash: "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
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
            password_hash: "$argon2id$v=19$m=65536,t=3,p=4$pDs5fiTYGTo0XSEt/3Cf7w$x8wFo37pR763HFqVMKupfveO0dBebHhLweI15eac8EI",
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

    const team1 = await prisma.team.create({
        data: {
            team_name: "Alen Kitasović",
            creator_id: player0.id,
            founder_id1: player1.id,
            founder_id2: player2.id
        }
    });

    const team2 = await prisma.team.create({
        data: {
            team_name: "Imotske Šarulje",
            creator_id: player0.id,
            founder_id1: player3.id,
            founder_id2: player4.id
        }
    });

    const teamPlayers = [
        {team_id: team1.team_id, player_id: player1.id},
        {team_id: team1.team_id, player_id: player2.id},
        {team_id: team2.team_id, player_id: player3.id},
        {team_id: team2.team_id, player_id: player4.id}
    ];
    await prisma.teamPlayer.createMany({data: teamPlayers});

    const playerPairs = [
        {player_id1: player1.id, player_id2: player2.id},
        {player_id1: player3.id, player_id2: player4.id}
    ];
    await prisma.playerPair.createMany({data: playerPairs});

    const rounds = [
        {
            round_number: 1,
            round_date: new Date('2024-01-01'),
            team1_id: 1,
            team2_id: 2
        }
    ];
    await prisma.round.createMany({data: rounds});

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
