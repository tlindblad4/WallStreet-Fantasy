-- ============================================================================
-- FIX: Allow league members to view other members (needed for leaderboard)
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "League members viewable by league members" ON public.league_members;
DROP POLICY IF EXISTS "Anyone can view league members" ON public.league_members;

-- Policy: Anyone can view league members (needed for leaderboard)
-- This is safe because it's just showing who's in the league
CREATE POLICY "Anyone can view league members" 
  ON public.league_members FOR SELECT USING (true);

-- Policy: Users can only update their own membership
CREATE POLICY "Users can update own membership" 
  ON public.league_members FOR UPDATE USING (user_id = auth.uid());

-- Policy: Only commissioners can delete members
CREATE POLICY "Commissioners can delete members" 
  ON public.league_members FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.leagues 
      WHERE leagues.id = league_members.league_id 
      AND leagues.commissioner_id = auth.uid()
    )
  );

-- ============================================================================
-- ALSO FIX: Allow viewing profiles for leaderboard display
-- ============================================================================

-- Policy: Anyone can view profiles (usernames, etc.)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles" 
  ON public.profiles FOR SELECT USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- VERIFY: Check members in Test League
-- ============================================================================

SELECT 
    lm.id as member_id,
    lm.user_id,
    lm.status,
    lm.cash_balance,
    p.username,
    p.email,
    l.name as league_name
FROM public.league_members lm
JOIN public.leagues l ON l.id = lm.league_id
LEFT JOIN public.profiles p ON p.id = lm.user_id
WHERE l.name = 'Test League' OR l.id = '6cb5423b-53c6-4ba0-a721-5f02e1991d7a';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ RLS policies updated for leaderboard!' as result;
SELECT '✅ Anyone can now view league members!' as result;
SELECT '✅ Anyone can now view profiles (usernames)!' as result;
SELECT '✅ Leaderboard should show all members!' as result;
