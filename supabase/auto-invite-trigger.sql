-- ============================================================================
-- AUTO-GENERATE INVITE CODES FOR NEW LEAGUES
-- This trigger automatically creates an invite code whenever a league is created
-- ============================================================================

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  -- Keep generating until we get a unique code
  LOOP
    -- Generate 8-character code
    code := upper(substring(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM league_invites WHERE invite_code = code) INTO exists_check;
    
    -- If unique, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create invite when league is created
CREATE OR REPLACE FUNCTION auto_create_league_invite()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate unique invite code
  new_code := generate_invite_code();
  
  -- Insert invite for the new league
  INSERT INTO league_invites (
    league_id,
    invited_by,
    invite_code,
    max_uses,
    uses_count
  ) VALUES (
    NEW.id,
    NEW.commissioner_id,
    new_code,
    100,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_create_invite_on_league ON leagues;
CREATE TRIGGER auto_create_invite_on_league
  AFTER INSERT ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_league_invite();

-- ============================================================================
-- BACKFILL: Create invites for existing leagues that don't have them
-- ============================================================================

INSERT INTO league_invites (league_id, invited_by, invite_code, max_uses, uses_count)
SELECT 
    l.id as league_id,
    l.commissioner_id as invited_by,
    generate_invite_code() as invite_code,
    100 as max_uses,
    0 as uses_count
FROM leagues l
LEFT JOIN league_invites li ON li.league_id = l.id
WHERE li.id IS NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Auto-invite trigger installed successfully!' as result;
SELECT '✅ All existing leagues now have invite codes!' as result;
SELECT '✅ Future leagues will automatically get invite codes!' as result;
