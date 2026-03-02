-- Options Trading Support for WallStreet Fantasy
-- Run this in Supabase SQL Editor

-- ============================================================================
-- OPTIONS CONTRACTS TABLE
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
-- OPTIONS EXPIRATION CHECK FUNCTION
-- ============================================================================

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
-- INDEXES FOR OPTIONS
-- ============================================================================

CREATE INDEX idx_options_member ON public.options_contracts(league_member_id);
CREATE INDEX idx_options_underlying ON public.options_contracts(underlying_symbol);
CREATE INDEX idx_options_status ON public.options_contracts(status);
CREATE INDEX idx_options_expiration ON public.options_contracts(expiration_date);

-- ============================================================================
-- RLS POLICIES FOR OPTIONS
-- ============================================================================

ALTER TABLE public.options_contracts ENABLE ROW LEVEL SECURITY;

-- Options viewable by league members
CREATE POLICY "Options viewable by league members" 
  ON public.options_contracts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      JOIN public.league_members viewer ON viewer.league_id = lm.league_id
      WHERE options_contracts.league_member_id = lm.id AND viewer.user_id = auth.uid()
    )
  );

-- Users can only create their own options
CREATE POLICY "Users can create own options" 
  ON public.options_contracts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE id = options_contracts.league_member_id AND user_id = auth.uid()
    )
  );

-- Users can only update their own options
CREATE POLICY "Users can update own options" 
  ON public.options_contracts FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE id = options_contracts.league_member_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- ADD OPTIONS TRADING FLAG TO LEAGUES
-- ============================================================================

ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS allow_options_trading BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- UPDATE PORTFOLIO CALCULATION TO INCLUDE OPTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_league_member_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  holdings_value DECIMAL := 0;
  cash_balance DECIMAL := 0;
  options_value DECIMAL := 0;
BEGIN
  -- Get cash balance
  SELECT lm.cash_balance INTO cash_balance
  FROM public.league_members lm
  WHERE lm.id = p_league_member_id;
  
  -- Get stock holdings value
  SELECT COALESCE(SUM(current_value), 0) INTO holdings_value
  FROM public.portfolio_holdings
  WHERE league_member_id = p_league_member_id;
  
  -- Get active options value (premium paid as cost, not value)
  -- Options don't add to portfolio value until exercised
  SELECT COALESCE(SUM(total_premium), 0) INTO options_value
  FROM public.options_contracts
  WHERE league_member_id = p_league_member_id
  AND status = 'active';
  
  -- Options premium reduces available cash but doesn't add to value
  -- until exercised. We return the total portfolio including options cost.
  RETURN cash_balance + holdings_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO AUTO-EXPIRE OPTIONS (run daily via cron)
-- ============================================================================

-- This would be called by a cron job or edge function daily
COMMENT ON FUNCTION check_expired_options() IS 'Run daily to mark expired options';

SELECT 'Options trading schema added successfully!' as result;
