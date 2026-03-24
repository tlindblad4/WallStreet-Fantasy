-- Check the actual data for debugging
SELECT 
    lm.id,
    lm.cash_balance,
    lm.total_value,
    l.starting_balance,
    l.name as league_name,
    ph.symbol,
    ph.shares,
    ph.average_cost,
    ph.current_value,
    sp.price as current_price
FROM league_members lm
JOIN leagues l ON l.id = lm.league_id
LEFT JOIN portfolio_holdings ph ON ph.league_member_id = lm.id
LEFT JOIN stock_prices sp ON sp.symbol = ph.symbol
WHERE lm.user_id = 'YOUR_USER_ID_HERE'
AND l.name = 'Test League';
