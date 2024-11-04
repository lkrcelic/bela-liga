-- Trigger Function to enforce modulo 4 on current_shuffler_index
CREATE OR REPLACE FUNCTION enforce_shuffler_index_modulo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_shuffler_index := (NEW.current_shuffler_index + 1) % 4;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger to apply the function before each update on OngoingMatch
CREATE TRIGGER trg_enforce_shuffler_index_modulo
    BEFORE UPDATE ON "OngoingMatch"
    FOR EACH ROW
EXECUTE FUNCTION enforce_shuffler_index_modulo();

-- Add CHECK constraint for current_shuffler_index
ALTER TABLE "OngoingMatch"
    ADD CONSTRAINT "chk_current_shuffler_index_range"
        CHECK (current_shuffler_index >= 0 AND current_shuffler_index < 4);
