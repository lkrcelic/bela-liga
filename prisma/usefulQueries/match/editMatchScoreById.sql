-- Edit player pair1 score by match id
PREPARE edit_player_pair1_score_by_match_id(int, int) AS
UPDATE "Match"
SET player_pair1_score = $2
WHERE id = $1;

-- (match id, player pair1 score)
EXECUTE edit_player_pair1_score_by_match_id($1, $2);
DEALLOCATE edit_player_pair1_score_by_match_id;


-- Edit player pair2 score by match id
PREPARE edit_player_pair2_score_by_match_id(int, int) AS
UPDATE "Match"
SET player_pair2_score = $2
WHERE id = $1;

-- (match id, player pair2 score)
EXECUTE edit_player_pair2_score_by_match_id($1, $2);
DEALLOCATE edit_player_pair2_score_by_match_id;
