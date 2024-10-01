import { z } from "zod";

// validation schema
const PlayerValidation = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    email: z.string().min(1).email(),
    player_role: z.union([z.literal("PLAYER"), z.literal("ADMIN")]).default("PLAYER"),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    birth_year: z.number().int().optional(),
    city: z.string().optional(),
    created_at: z.date().optional(),
    last_updated_at: z.date().optional(),
  }).transform((o) => ({
    
    username: o.username,
    password_hash: o.password,
    email: o.email,
    player_role: o.player_role,
    first_name: o.first_name,
    last_name: o.last_name,
    birth_year: o.birth_year,
    city: o.city,
    created_at: o.created_at,
    last_updated_at: o.last_updated_at
  }));

// output schema
const PlayerOutput = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    player_role: z.string(),
    first_name: z.string(),
    last_name: z.string()
});

const PlayersOutput = z.array(PlayerOutput);

export const playerValidation = PlayerValidation;
export const playerOutput = PlayerOutput;
export const playersOutput = PlayersOutput;
