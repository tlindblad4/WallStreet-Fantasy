-- ============================================================================
-- WALLSTREET FANTASY - COMPLETE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTH (handled by Supabase Auth, extended here)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAGUES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  commissioner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- League Settings
  starting_balance DECIMAL(15, 2) DEFAULT 100000.00,
  season_length_days INTEGER DEFAULT 90,
  max_players INTEGER DEFAULT 20,
  trade_limit_per_day INTEGER DEFAULT 10,
  allow_fractional_shares BOOLEAN DEFAULT FALSE,
  allow_options_trading BOOLEAN DEFAULT FALSE,  -- NEW: Enable options trading
  
  -- Season Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  season_start_date TIMESTAMPTZ,
  season_end_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAGUE MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.league_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Member Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Portfolio
  cash_balance DECIMAL(15, 2) DEFAULT 100000.00,
  total_value DECIMAL(15, 2) DEFAULT 100000.00,
  total_return DECIMAL(15, 2) DEFAULT 0.00,
  total_return_percent DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Rankings
  current_rank INTEGER,
  previous_rank INTEGER,
  
  UNIQUE(league_id, user_id)
);

-- ============================================================================
-- PORTFOLIO HOLDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_member_id UUID REFERENCES public.league_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Stock Info
  symbol TEXT NOT NULL,
  company_name TEXT,
  
  -- Position
  shares DECIMAL(15, 8) NOT NULL DEFAULT 0,
  average_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Current Value (updated by backend)
  current_price DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  unrealized_gain_loss DECIMAL(15, 2),
  unrealized_gain_loss_percent DECIMAL(5, 2),
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(league_member_id, symbol)
);

-- ============================================================================
-- TRADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_member_id UUID REFERENCES public.league_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Trade Details
  symbol TEXT NOT NULL,
  company_name TEXT,
  trade_type TEXT CHECK (trade_type IN ('buy', 'sell')),
  shares DECIMAL(15, 8) NOT NULL,
  price_per_share DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  asset_type TEXT DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto')),  -- NEW: Support crypto
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEAGUE INVITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.league_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Invite Details
  invite_code TEXT UNIQUE NOT NULL,
  email TEXT, -- optional, for email invites
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  
  -- Status
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OPTIONS CONTRACTS (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.options_contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_member_id UUID REFERENCES public.league_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Contract Details
  underlying_symbol TEXT NOT NULL,  -- e.g., "AAPL"
  option_type TEXT CHECK (option_type IN ('call', 'put')) NOT NULL,
  strike_price DECIMAL(15, 2) NOT NULL,
  expiration_date DATE NOT NULL,
  contracts INTEGER NOT NULL DEFAULT 1,  -- Number of contracts (1 contract = 100 shares)
  
  -- Pricing
  premium_paid DECIMAL(15, 2) NOT NULL,  -- Price per contract
  total_premium DECIMAL(15, 2) NOT NULL,  -- premium_paid * contracts
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exercised', 'expired', 'closed')),
  
  -- Exercise tracking
  exercised_at TIMESTAMPTZ,
  exercise_profit DECIMAL(15, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MARKET DATA CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_prices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  company_name TEXT,
  
  -- Price Data
  current_price DECIMAL(15, 2),
  previous_close DECIMAL(15, 2),
  change_amount DECIMAL(15, 2),
  change_percent DECIMAL(5, 2),
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'finnhub'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leagues_commissioner ON public.leagues(commissioner_id);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON public.leagues(status);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON public.league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_rank ON public.league_members(current_rank);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_member ON public.portfolio_holdings(league_member_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON public.portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_member ON public.trades(league_member_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_league_invites_code ON public.league_invites(invite_code);

-- NEW: Options indexes
CREATE INDEX IF NOT EXISTS idx_options_member ON public.options_contracts(league_member_id);
CREATE INDEX IF NOT EXISTS idx_options_underlying ON public.options_contracts(underlying_symbol);
CREATE INDEX IF NOT EXISTS idx_options_status ON public.options_contracts(status);
CREATE INDEX IF NOT EXISTS idx_options_expiration ON public.options_contracts(expiration_date);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options_contracts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leagues: Viewable by members, manageable by commissioner
DROP POLICY IF EXISTS "Leagues viewable by members" ON public.leagues;
CREATE POLICY "Leagues viewable by members" 
  ON public.leagues FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_id = leagues.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Commissioners can manage leagues" ON public.leagues;
CREATE POLICY "Commissioners can manage leagues" 
  ON public.leagues FOR ALL USING (commissioner_id = auth.uid());

-- League Members: Viewable by league members
DROP POLICY IF EXISTS "League members viewable by league members" ON public.league_members;
CREATE POLICY "League members viewable by league members" 
  ON public.league_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid()
    )
  );

-- Portfolio Holdings: Viewable by league members
DROP POLICY IF EXISTS "Holdings viewable by league members" ON public.portfolio_holdings;
CREATE POLICY "Holdings viewable by league members" 
  ON public.portfolio_holdings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE portfolio_holdings.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

-- Trades: Viewable by league members
DROP POLICY IF EXISTS "Trades viewable by league members" ON public.trades;
CREATE POLICY "Trades viewable by league members" 
  ON public.trades FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE trades.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

-- Stock Prices: Publicly readable
DROP POLICY IF EXISTS "Stock prices are public" ON public.stock_prices;
CREATE POLICY "Stock prices are public" 
  ON public.stock_prices FOR SELECT USING (true);

-- NEW: Options policies
DROP POLICY IF EXISTS "Options viewable by league members" ON public.options_contracts;
CREATE POLICY "Options viewable by league members" 
  ON public.options_contracts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE options_contracts.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own options" ON public.options_contracts;
CREATE POLICY "Users can create own options" 
  ON public.options_contracts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE id = options_contracts.league_member_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own options" ON public.options_contracts;
CREATE POLICY "Users can update own options" 
  ON public.options_contracts FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE id = options_contracts.league_member_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leagues_updated_at ON public.leagues;
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON public.leagues 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_league_members_updated_at ON public.league_members;
CREATE TRIGGER update_league_members_updated_at BEFORE UPDATE ON public.league_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate portfolio value
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_league_member_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  holdings_value DECIMAL := 0;
  cash_balance DECIMAL := 0;
BEGIN
  -- Get cash balance
  SELECT lm.cash_balance INTO cash_balance
  FROM public.league_members lm
  WHERE lm.id = p_league_member_id;
  
  -- Get holdings value
  SELECT COALESCE(SUM(current_value), 0) INTO holdings_value
  FROM public.portfolio_holdings
  WHERE league_member_id = p_league_member_id;
  
  RETURN cash_balance + holdings_value;
END;
$$ LANGUAGE plpgsql;

-- NEW: Options expiration check function
CREATE OR REPLACE FUNCTION check_expired_options()
RETURNS void AS $$
DECLARE
  contract RECORD;
  current_price DECIMAL;
  intrinsic_value DECIMAL;
BEGIN
  -- Get all active options that have expired
  FOR contract IN 
    SELECT * FROM public.options_contracts 
    WHERE status = 'active' 
    AND expiration_date < CURRENT_DATE
  LOOP
    -- Get current stock price (from stock_prices table)
    SELECT current_price INTO current_price
    FROM public.stock_prices
    WHERE symbol = contract.underlying_symbol;
    
    IF current_price IS NOT NULL THEN
      -- Calculate intrinsic value
      IF contract.option_type = 'call' THEN
        intrinsic_value := GREATEST(0, current_price - contract.strike_price);
      ELSE -- put
        intrinsic_value := GREATEST(0, contract.strike_price - current_price);
      END IF;
      
      -- Mark as expired with profit/loss
      UPDATE public.options_contracts
      SET 
        status = CASE 
          WHEN intrinsic_value > 0 THEN 'exercised' 
          ELSE 'expired' 
        END,
        exercised_at = NOW(),
        exercise_profit = (intrinsic_value * 100 * contracts) - total_premium
      WHERE id = contract.id;
    ELSE
      -- Mark as expired if we can't get price
      UPDATE public.options_contracts
      SET status = 'expired'
      WHERE id = contract.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ WallStreet Fantasy database schema installed successfully!' as result;
SELECT '📊 Tables created: profiles, leagues, league_members, portfolio_holdings, trades, league_invites, options_contracts, stock_prices' as tables;
SELECT '🔒 RLS policies enabled for all tables' as security;
SELECT '⚡ Indexes created for performance' as performance;
SELECT '🎯 Functions: update_updated_at_column(), calculate_portfolio_value(), check_expired_options()' as functions;
SELECT '' as note;
SELECT '⚠️  IMPORTANT: Set up a daily cron job to call check_expired_options() for automatic option expiration' as reminder;
