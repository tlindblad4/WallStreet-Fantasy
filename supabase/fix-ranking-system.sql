-- ============================================================================
-- RANKING SYSTEM: Calculate and update league rankings
-- ============================================================================

-- Function to calculate rankings for a league
CREATE OR REPLACE FUNCTION calculate_league_rankings(p_league_id UUID)
RETURNS void AS $$
BEGIN
  -- Update rankings based on total portfolio value
  WITH ranked_members AS (
    SELECT 
      lm.id,
      ROW_NUMBER() OVER (
        ORDER BY (lm.cash_balance + COALESCE(
          (SELECT SUM(ph.shares * COALESCE(sp.price, ph.average_cost))
           FROM portfolio_holdings ph
           LEFT JOIN stock_prices sp ON sp.symbol = ph.symbol
           WHERE ph.league_member_id = lm.id),
          0
        )) DESC
      ) as new_rank
    FROM league_members lm
    WHERE lm.league_id = p_league_id
    AND lm.status = 'active'
  )
  UPDATE league_members lm
  SET current_rank = rm.new_rank
  FROM ranked_members rm
  WHERE lm.id = rm.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update rankings when trades are made
CREATE OR REPLACE FUNCTION update_rankings_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate rankings for the affected league
  PERFORM calculate_league_rankings(
    (SELECT league_id FROM league_members WHERE id = NEW.league_member_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on trades
DROP TRIGGER IF EXISTS update_rankings_after_trade ON trades;
CREATE TRIGGER update_rankings_after_trade
  AFTER INSERT OR UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_rankings_on_trade();

-- Trigger to auto-update rankings when stock prices change
CREATE OR REPLACE FUNCTION update_rankings_on_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings for all leagues that have holdings in this stock
  FOR league_id IN 
    SELECT DISTINCT lm.league_id
    FROM portfolio_holdings ph
    JOIN league_members lm ON lm.id = ph.league_member_id
    WHERE ph.symbol = NEW.symbol
  LOOP
    PERFORM calculate_league_rankings(league_id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on stock_prices
DROP TRIGGER IF EXISTS update_rankings_after_price_change ON stock_prices;
CREATE TRIGGER update_rankings_after_price_change
  AFTER UPDATE OF price ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_rankings_on_price_change();

-- Run initial ranking calculation for all leagues
SELECT calculate_league_rankings(id) FROM leagues WHERE status = 'active';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Ranking system installed!' as result;
SELECT '✅ Auto-ranking triggers created!' as result;
SELECT '✅ Rankings will update automatically on trades and price changes!' as result;
