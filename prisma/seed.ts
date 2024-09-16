// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Your seed data logic
  const player1 = await prisma.player.create({
    data: {
      username: "john_doe",
      password_hash: "securepassword",
      email: "john@example.com",
      player_role: "PLAYER",
      first_name: "John",
      last_name: "Doe",
      birth_year: 1990,
      city: "New York",
    },
  });

  const player2 = await prisma.player.create({
    data: {
      username: "jane_smith",
      password_hash: "securepassword",
      email: "jane@example.com",
      player_role: "ADMIN",
      first_name: "Jane",
      last_name: "Smith",
      birth_year: 1992,
      city: "Los Angeles",
    },
  });

  console.log({ player1, player2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
