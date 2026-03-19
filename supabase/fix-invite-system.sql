-- ============================================================================
-- FIX INVITE SYSTEM - Run this in Supabase SQL Editor
-- This ensures all leagues have invite codes and the auto-trigger is working
-- ============================================================================

-- Step 1: Check if the trigger function exists
DO $$
BEGIN
    -- Create function to generate unique invite codes if not exists
    CREATE OR REPLACE FUNCTION generate_invite_code()
    RETURNS TEXT AS $func$
    DECLARE
        code TEXT;
        exists_check BOOLEAN;
    BEGIN
        LOOP
            code := upper(substring(md5(random()::text), 1, 8));
            SELECT EXISTS(SELECT 1 FROM league_invites WHERE invite_code = code) INTO exists_check;
            IF NOT exists_check THEN
                RETURN code;
            END IF;
        END LOOP;
    END;
    $func$ LANGUAGE plpgsql;
END $$;

-- Step 2: Create or replace the trigger function
CREATE OR REPLACE FUNCTION auto_create_league_invite()
RETURNS TRIGGER AS $func$
BEGIN
    INSERT INTO league_invites (league_id, invited_by, invite_code, max_uses, uses_count)
    VALUES (NEW.id, NEW.commissioner_id, generate_invite_code(), 100, 0);
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if any and create new one
DROP TRIGGER IF EXISTS auto_create_invite_on_league ON leagues;
CREATE TRIGGER auto_create_invite_on_league
    AFTER INSERT ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_league_invite();

-- Step 4: Backfill - Create invites for ALL leagues that don't have them
INSERT INTO league_invites (league_id, invited_by, invite_code, max_uses, uses_count)
SELECT 
    l.id as league_id,
    l.commissioner_id as invited_by,
    generate_invite_code() as invite_code,
    100 as max_uses,
    0 as uses_count
FROM leagues l
LEFT JOIN league_invites li ON li.league_id = l.id
WHERE li.id IS NULL;

-- Step 5: Verify results
SELECT 
    'Total leagues' as metric,
    COUNT(*)::text as value
FROM leagues
UNION ALL
SELECT 
    'Leagues with invites' as metric,
    COUNT(DISTINCT league_id)::text as value
FROM league_invites
UNION ALL
SELECT 
    'Leagues missing invites' as metric,
    (COUNT(*) - (SELECT COUNT(DISTINCT league_id) FROM league_invites))::text as value
FROM leagues;
