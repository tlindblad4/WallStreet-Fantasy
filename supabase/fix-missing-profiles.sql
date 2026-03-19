-- ============================================================================
-- FIX: Create profiles for users that don't have them
-- This ensures leaderboard shows usernames instead of "Unknown"
-- ============================================================================

-- Create profiles for existing users that don't have them
INSERT INTO public.profiles (id, username, email, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1),
        'user_' || substr(au.id::text, 1, 8)
    ) as username,
    au.email,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Create a trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFY: Check profiles were created
-- ============================================================================

SELECT 
    'Total auth users' as metric,
    COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
    'Profiles created' as metric,
    COUNT(*)::text as value
FROM public.profiles
UNION ALL
SELECT 
    'Users missing profiles' as metric,
    (COUNT(*) - (SELECT COUNT(*) FROM public.profiles))::text as value
FROM auth.users;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Profiles created for all users!' as result;
SELECT '✅ Auto-profile creation trigger installed!' as result;
SELECT '✅ Leaderboard will now show usernames!' as result;
