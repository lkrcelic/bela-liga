-- Trigger Function to Update current_shuffler_index in OngoingMatch
CREATE
OR REPLACE FUNCTION update_shuffler_index_on_new_result()
RETURNS TRIGGER AS $$
BEGIN
UPDATE "OngoingMatch"
SET current_shuffler_index = (current_shuffler_index + 1) % 4
WHERE id = NEW.match_id;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- New Trigger on OngoingBelaResult to Update Shuffler Index
CREATE TRIGGER trg_update_shuffler_index_on_new_result
    AFTER INSERT
    ON "OngoingBelaResult"
    FOR EACH ROW
    EXECUTE FUNCTION update_shuffler_index_on_new_result();

-- Add CHECK constraint for current_shuffler_index
ALTER TABLE "OngoingMatch"
    ADD CONSTRAINT "chk_current_shuffler_index_range"
        CHECK (current_shuffler_index >= 0 AND current_shuffler_index < 4);
