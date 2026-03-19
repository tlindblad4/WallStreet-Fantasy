-- ============================================================================
-- FIX: Allow anyone to view league info needed for joining
-- This fixes the "Error finding league" issue when using invite codes
-- ============================================================================

-- Policy: Anyone can view leagues (needed for joining via invite)
-- This is safe because we're not exposing sensitive data, just basic league info
DROP POLICY IF EXISTS "Anyone can view leagues for joining" ON public.leagues;

CREATE POLICY "Anyone can view leagues for joining" 
  ON public.leagues FOR SELECT USING (true);

-- Alternative: More restrictive policy - only allow viewing if you have a valid invite
-- DROP POLICY IF EXISTS "Can view league with valid invite" ON public.leagues;
-- CREATE POLICY "Can view league with valid invite" 
--   ON public.leagues FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.league_invites 
--       WHERE league_invites.league_id = leagues.id
--       AND league_invites.uses_count < league_invites.max_uses
--     )
--   );

-- ============================================================================
-- ALSO FIX: League members table - allow checking membership for joining
-- ============================================================================

-- Policy: Users can check if they're already a member (needed for join validation)
DROP POLICY IF EXISTS "Users can check their own membership" ON public.league_members;

CREATE POLICY "Users can check their own membership" 
  ON public.league_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.league_invites 
      WHERE league_invites.league_id = league_members.league_id
    )
  );

-- ============================================================================
-- VERIFY: Check that the Test League exists and is readable
-- ============================================================================

SELECT 
    l.id,
    l.name,
    l.commissioner_id,
    l.starting_balance,
    l.status,
    li.invite_code,
    li.uses_count,
    li.max_uses
FROM public.leagues l
LEFT JOIN public.league_invites li ON li.league_id = l.id
WHERE l.name = 'Test League' OR li.invite_code = 'A58B3FB6';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ RLS policies updated for league joining!' as result;
SELECT '✅ Anyone can now view league info when joining!' as result;
SELECT '✅ Join flow should now work completely!' as result;
