-- WallStreet Fantasy Database Schema
-- Run this in Supabase SQL Editor

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

CREATE INDEX idx_leagues_commissioner ON public.leagues(commissioner_id);
CREATE INDEX idx_leagues_status ON public.leagues(status);
CREATE INDEX idx_league_members_league ON public.league_members(league_id);
CREATE INDEX idx_league_members_user ON public.league_members(user_id);
CREATE INDEX idx_league_members_rank ON public.league_members(current_rank);
CREATE INDEX idx_portfolio_holdings_member ON public.portfolio_holdings(league_member_id);
CREATE INDEX idx_portfolio_holdings_symbol ON public.portfolio_holdings(symbol);
CREATE INDEX idx_trades_member ON public.trades(league_member_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_league_invites_code ON public.league_invites(invite_code);

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

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leagues: Viewable by members, manageable by commissioner
CREATE POLICY "Leagues viewable by members" 
  ON public.leagues FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_id = leagues.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Commissioners can manage leagues" 
  ON public.leagues FOR ALL USING (commissioner_id = auth.uid());

-- League Members: Viewable by league members
CREATE POLICY "League members viewable by league members" 
  ON public.league_members FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid()
    )
  );

-- Portfolio Holdings: Viewable by league members
CREATE POLICY "Holdings viewable by league members" 
  ON public.portfolio_holdings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE portfolio_holdings.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

-- Trades: Viewable by league members
CREATE POLICY "Trades viewable by league members" 
  ON public.trades FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE trades.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

-- Stock Prices: Publicly readable
CREATE POLICY "Stock prices are public" 
  ON public.stock_prices FOR SELECT USING (true);

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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON public.leagues 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
