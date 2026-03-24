-- Fix Bitcoin price in database
-- Run this in your Supabase SQL Editor

-- 1. Update stock_prices table with correct Bitcoin price
INSERT INTO stock_prices (symbol, price, change, change_percent, updated_at)
VALUES ('BTC', 85000, 0, 0, NOW())
ON CONFLICT (symbol) 
DO UPDATE SET 
    price = 85000,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    updated_at = NOW();

-- 2. Update portfolio_holdings current_price for all BTC holdings
UPDATE portfolio_holdings
SET current_price = 85000
WHERE symbol = 'BTC';

-- 3. Verify the update
SELECT 
    ph.symbol,
    ph.shares,
    ph.current_price,
    ph.shares * ph.current_price as calculated_value
FROM portfolio_holdings ph
WHERE ph.symbol = 'BTC';
