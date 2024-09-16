// src/app/api/players/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Handle GET request to fetch all players
export async function GET() {
    try {
        const players = await prisma.player.findMany();
        return new NextResponse.json(players,   { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

