// The league currently being played. The home page links to it and new teams join it.
// Override with NEXT_PUBLIC_LEAGUE_ID when a new season starts.
export const CURRENT_LEAGUE_ID: number = Number(process.env.NEXT_PUBLIC_LEAGUE_ID ?? 2) || 2;
