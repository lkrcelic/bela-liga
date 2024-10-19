# Tasks

- Kreirati match nakon određivanja timova
    1. Samo kreiranje matcha
    2. Napraviti neki store u kojem ce biti spremljeni igrači koji trenutno igraju match
    3. Isto tako nakon početka match-a treba odrediti tko miješa taj result, na radnom se određuje onda se svaki
       slijedeći koji miješa određuje kružno, tako da onaj tko je bio prvi slijedeći miješa

```
dbRound:  {
  "id": 1,
  "round_number": 1,
  "round_date": "2024-01-01T00:00:00.000Z",
  "team1_id": 1,
  "team2_id": 2,
  "team1": {
    "team_id": 1,
    "team_name": "Alen Kitasović",
    "founder_id1": 2,
    "founder_id2": 3,
    "creator_id": 1,
    "created_at": "2024-10-11T23:07:09.137Z",
    "last_updated_at": "2024-10-11T23:07:09.137Z",
    "teamPlayers": [
      {
        "team_id": 1,
        "player_id": 2,
        "player": {
          "id": 2,
          "username": "player",
          "first_name": "Jane",
          "last_name": "Smith"
        }
      },
      {
        "team_id": 1,
        "player_id": 3,
        "player": {
          "id": 3,
          "username": "johnny",
          "first_name": "Johnny",
          "last_name": "Smith"
        }
      }
    ]
  },
  "team2": {
    "team_id": 2,
    "team_name": "Imotske Šarulje",
    "founder_id1": 4,
    "founder_id2": 5,
    "creator_id": 1,
    "created_at": "2024-10-11T23:07:09.139Z",
    "last_updated_at": "2024-10-11T23:07:09.139Z",
    "teamPlayers": [
      {
        "team_id": 2,
        "player_id": 4,
        "player": {
          "id": 4,
          "username": "friendzone123",
          "first_name": "De'Shaun",
          "last_name": "Smith"
        }
      },
      {
          "first_name": "Brock",
          "last_name": "Smith"
        }
      }
    ]
  }
}

```
