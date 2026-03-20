-- ============================================================================
-- ADD OPTIONS TRADING SUPPORT
-- ============================================================================

-- Add allow_options_trading column to leagues table
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS allow_options_trading BOOLEAN DEFAULT FALSE;

-- Add options_enabled column to league_members table (to track if member can trade options)
ALTER TABLE public.league_members
ADD COLUMN IF NOT EXISTS options_enabled BOOLEAN DEFAULT FALSE;

-- Create options_positions table to track options trades
CREATE TABLE IF NOT EXISTS public.options_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_member_id UUID REFERENCES public.league_members(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('call', 'put')),
  strike_price DECIMAL(15, 2) NOT NULL,
  expiration_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  premium DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  close_price DECIMAL(15, 2),
  profit_loss DECIMAL(15, 2)
);

-- Enable RLS on options_positions
ALTER TABLE public.options_positions ENABLE ROW LEVEL SECURITY;

-- Policy: League members can view their own options
CREATE POLICY "Members can view own options" 
  ON public.options_positions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.id = options_positions.league_member_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- Policy: League members can create options for themselves
CREATE POLICY "Members can create own options" 
  ON public.options_positions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.leagues l ON l.id = lm.league_id
      WHERE lm.id = options_positions.league_member_id 
      AND lm.user_id = auth.uid()
      AND l.allow_options_trading = TRUE
    )
  );

-- Policy: League members can update their own options
CREATE POLICY "Members can update own options" 
  ON public.options_positions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.id = options_positions.league_member_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Options trading column added to leagues table!' as result;
SELECT '✅ Options positions table created!' as result;
SELECT '✅ RLS policies configured for options!' as result;
SELECT '✅ Options trading is now ready!' as result;
