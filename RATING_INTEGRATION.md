# Rating System Integration Guide

## Overview
This guide explains how to integrate the Glicko-2 rating system into your Belot tournament app.

## 1. Database Migration

Run the following command to create and apply the migration:

```bash
npx prisma migrate dev --name add_player_ratings
```

This will add three new fields to the `Player` model:
- `rating` (Float, default: 1500.0)
- `rating_deviation` (Float, default: 350.0)
- `volatility` (Float, default: 0.06)

## 2. Usage Examples

### Update Ratings After a Match

```typescript
import { updateRatingsAfterMatch } from "@/app/_services/ratingService";

// After a match completes
const team1PlayerIds = [1, 2]; // Player IDs from team 1
const team2PlayerIds = [3, 4]; // Player IDs from team 2

// Team 1 won
await updateRatingsAfterMatch(team1PlayerIds, team2PlayerIds, 1);

// Team 2 won
await updateRatingsAfterMatch(team1PlayerIds, team2PlayerIds, 0);

// Draw (if applicable)
await updateRatingsAfterMatch(team1PlayerIds, team2PlayerIds, 0.5);
```

### Get Leaderboard

```typescript
import { getLeaderboard } from "@/app/_services/ratingService";

// Get top 50 players
const topPlayers = await getLeaderboard(50);

// Display
topPlayers.forEach((player, index) => {
  console.log(`${index + 1}. ${player.username}: ${Math.round(player.rating)}`);
});
```

### Get Player Rating

```typescript
import { getPlayerRating } from "@/app/_services/ratingService";

const playerRating = await getPlayerRating(playerId);
console.log(`Rating: ${Math.round(playerRating.rating)}`);
console.log(`Uncertainty: ±${Math.round(playerRating.rating_deviation)}`);
```

## 3. Integration Points

### When to Update Ratings

Add rating updates in your match completion logic:

```typescript
// In your match service or API endpoint
async function completeMatch(matchId: number) {
  // 1. Get match data
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      playerPair1: true,
      playerPair2: true
    }
  });

  // 2. Determine winner
  const team1Won = match.player_pair1_score > match.player_pair2_score;
  const team2Won = match.player_pair2_score > match.player_pair1_score;
  const isDraw = match.player_pair1_score === match.player_pair2_score;

  // 3. Calculate score (1 = win, 0.5 = draw, 0 = loss)
  const scoreTeam1 = team1Won ? 1 : isDraw ? 0.5 : 0;

  // 4. Update ratings
  const team1Players = [
    match.playerPair1.player_id1,
    match.playerPair1.player_id2
  ];
  const team2Players = [
    match.playerPair2.player_id1,
    match.playerPair2.player_id2
  ];

  await updateRatingsAfterMatch(team1Players, team2Players, scoreTeam1);

  // 5. Mark match as complete
  await prisma.match.update({
    where: { id: matchId },
    data: { /* your completion logic */ }
  });
}
```

## 4. Display Rating in UI

### Add to Player Profile

```typescript
// In your profile page
const player = await prisma.player.findUnique({
  where: { id: userId },
  select: {
    username: true,
    rating: true,
    rating_deviation: true
  }
});

// Display
<Typography>
  Rating: {Math.round(player.rating)} ± {Math.round(player.rating_deviation)}
</Typography>
```

### Create Leaderboard Page

```typescript
// src/app/leaderboard/page.tsx
import { getLeaderboard } from "@/app/_services/ratingService";

export default async function LeaderboardPage() {
  const players = await getLeaderboard(50);

  return (
    <div>
      <h1>Leaderboard</h1>
      {players.map((player, index) => (
        <div key={player.id}>
          <span>{index + 1}.</span>
          <span>{player.username}</span>
          <span>{Math.round(player.rating)}</span>
        </div>
      ))}
    </div>
  );
}
```

## 5. Rating System Details

### How It Works

- **Initial Rating**: 1500 (average player)
- **Rating Deviation**: Measures uncertainty (high = new/inactive player)
- **Volatility**: Measures consistency (low = predictable performance)
- **Scale Factor**: 2 (balanced rating changes)

### Rating Changes

- Beating higher-rated players = larger rating gain
- Losing to lower-rated players = larger rating loss
- New players have larger rating swings (high RD)
- Experienced players have smaller swings (low RD)

### Typical Rating Ranges

- 1000-1200: Beginner
- 1200-1400: Intermediate
- 1400-1600: Advanced
- 1600-1800: Expert
- 1800+: Master

## 6. Optional Enhancements

### Add RD Decay (for inactive players)

```typescript
// Run periodically (e.g., weekly)
async function decayInactivePlayers() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  await prisma.player.updateMany({
    where: {
      last_updated_at: { lt: oneMonthAgo }
    },
    data: {
      rating_deviation: { increment: 10 } // Increase uncertainty
    }
  });
}
```

### Add Rating History Tracking

Create a new model to track rating changes over time:

```prisma
model RatingHistory {
  id         Int      @id @default(autoincrement())
  player_id  Int
  rating     Float
  match_id   Int?
  created_at DateTime @default(now())
  
  player Player @relation(fields: [player_id], references: [id])
  match  Match? @relation(fields: [match_id], references: [id])
}
```

## 7. Testing

Test the rating system with known scenarios:

```typescript
// Test: Equal players, winner should gain ~32 points
await updateRatingsAfterMatch([1, 2], [3, 4], 1);

// Test: Underdog wins, should gain more points
// Player 1,2 = 1300 rating
// Player 3,4 = 1700 rating
await updateRatingsAfterMatch([1, 2], [3, 4], 1);
```

## 8. Notes

- The SCALE factor is set to 2 (reduced from 16 in original code)
- This provides more stable, gradual rating changes
- Adjust SCALE in `ratingService.ts` if needed
- Consider implementing full Glicko-2 volatility updates for production
