"use client"; // This is a client component

import {useEffect, useState} from "react";
import styles from "@/app/styles/Form.modules.css";
import {logoutUser} from "@/app/fetchers/authentication/logout";

export default function Home() {
  const [players, setPlayers] = useState([]);

  async function logOut(): Promise<void> {
    await logoutUser();
    window.location.reload();
  }

  // Fetch all players
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/players");
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    }

    fetchPlayers();
  }, []);

  return (
    <div>
      <h2>Welcome to the Bela Tournament App</h2>
      <p>Organize and participate in Bela and Treseta tournaments!</p>

      <h3>Player List:</h3>
      <ul>
        {players.length > 0 ? (
          players.map((player) => <li key={player.player_id}>{player.username}</li>)
        ) : (
          <li>No players found</li>
        )}
      </ul>
      <button type="submit" onClick={logOut} className={styles.button}>
        Log out
      </button>
    </div>
  );
}
