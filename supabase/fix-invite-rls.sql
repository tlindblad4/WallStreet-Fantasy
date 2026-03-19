-- ============================================================================
-- FIX: Add RLS policy for league_invites table
-- This allows anyone to read invite codes (needed for joining leagues)
-- ============================================================================

-- Enable RLS on league_invites if not already enabled
ALTER TABLE public.league_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view invite codes" ON public.league_invites;
DROP POLICY IF EXISTS "Commissioners can manage invites" ON public.league_invites;

-- Policy: Anyone can view invite codes (needed for joining)
CREATE POLICY "Anyone can view invite codes" 
  ON public.league_invites FOR SELECT USING (true);

-- Policy: Only commissioners can create/update/delete invites
CREATE POLICY "Commissioners can manage invites" 
  ON public.league_invites FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leagues 
      WHERE leagues.id = league_invites.league_id 
      AND leagues.commissioner_id = auth.uid()
    )
  );

-- ============================================================================
-- ALSO FIX: Ensure league_invites table exists with proper structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.league_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 100,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.league_invites ENABLE ROW LEVEL SECURITY;

-- Recreate policies after ensuring table exists
DROP POLICY IF EXISTS "Anyone can view invite codes" ON public.league_invites;
DROP POLICY IF EXISTS "Commissioners can manage invites" ON public.league_invites;

CREATE POLICY "Anyone can view invite codes" 
  ON public.league_invites FOR SELECT USING (true);

CREATE POLICY "Commissioners can manage invites" 
  ON public.league_invites FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leagues 
      WHERE leagues.id = league_invites.league_id 
      AND leagues.commissioner_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFY: Check that Test League has an invite code
-- ============================================================================

SELECT 
    l.name as league_name,
    li.invite_code,
    li.uses_count,
    li.max_uses
FROM public.leagues l
LEFT JOIN public.league_invites li ON li.league_id = l.id
WHERE l.name = 'Test League';

-- ============================================================================
-- BACKFILL: Create invites for any leagues missing them
-- ============================================================================

INSERT INTO public.league_invites (league_id, invited_by, invite_code, max_uses, uses_count)
SELECT 
    l.id as league_id,
    l.commissioner_id as invited_by,
    upper(substring(md5(random()::text), 1, 8)) as invite_code,
    100 as max_uses,
    0 as uses_count
FROM public.leagues l
LEFT JOIN public.league_invites li ON li.league_id = l.id
WHERE li.id IS NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ RLS policy added for league_invites!' as result;
SELECT '✅ Anyone can now view invite codes to join leagues!' as result;
SELECT '✅ Commissioners can still manage their invites!' as result;
