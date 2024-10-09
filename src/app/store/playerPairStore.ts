import {create} from "zustand";
import {Player} from "@prisma/client";

export type PlayersState = {
    playerPair1: {
        player1: Player;
        player2: Player;
    };
    playerPair2: {
        player1: Player;
        player2: Player;
    };
}

const usePlayerPairStore = create<PlayersState>(() => ({
    playerPair1: {
        player1: {
            id: 1,
            username: "player_one",
            email: "player1@example.com",
            player_role: "PLAYER",
            first_name: "John",
            last_name: "Doe",
        },
        player2: {
            id: 2,
            username: "player_two",
            email: "player2@example.com",
            player_role: "ADMIN",
            first_name: "Jane",
            last_name: "Smith",
        },
    },
    playerPair2: {
        player1: {
            id: 3,
            username: "player_three",
            email: "player3@example.com",
            player_role: "PLAYER",
            first_name: "Alice",
            last_name: "Johnson",
        },
        player2: {
            id: 4,
            username: "player_four",
            email: "player4@example.com",
            player_role: "ADMIN",
            first_name: "Bob",
            last_name: "Williams",
        },
    },

}));

export default usePlayerPairStore;
