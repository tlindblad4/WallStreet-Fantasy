-- ============================================================================
-- ADVANCED ORDER TYPES: Stop-Loss and Limit Orders
-- ============================================================================

-- Create pending_orders table for advanced orders
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_member_id UUID REFERENCES public.league_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Order Details
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('limit_buy', 'limit_sell', 'stop_loss')),
  quantity DECIMAL(15, 8) NOT NULL,
  target_price DECIMAL(15, 2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'cancelled', 'expired')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- For stop-loss: track the high price since order creation
  highest_price_seen DECIMAL(15, 2),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_target_price CHECK (target_price > 0)
);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" 
  ON public.pending_orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.id = pending_orders.league_member_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- Policy: Users can create orders for themselves
CREATE POLICY "Users can create own orders" 
  ON public.pending_orders FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.id = pending_orders.league_member_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- Policy: Users can cancel their own orders
CREATE POLICY "Users can cancel own orders" 
  ON public.pending_orders FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.id = pending_orders.league_member_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTION: Process pending orders when prices update
-- ============================================================================

CREATE OR REPLACE FUNCTION process_pending_orders()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  current_price DECIMAL(15, 2);
  member_cash DECIMAL(15, 2);
  member_id UUID;
BEGIN
  current_price := NEW.price;
  
  -- Process limit buy orders (buy when price drops to target or below)
  FOR order_record IN 
    SELECT po.*, lm.cash_balance, lm.id as member_id
    FROM public.pending_orders po
    JOIN public.league_members lm ON lm.id = po.league_member_id
    WHERE po.symbol = NEW.symbol
    AND po.order_type = 'limit_buy'
    AND po.status = 'pending'
    AND current_price <= po.target_price
  LOOP
    -- Check if user has enough cash
    IF order_record.cash_balance >= (order_record.quantity * current_price) THEN
      -- Execute the buy
      INSERT INTO public.trades (
        league_member_id, symbol, type, quantity, price
      ) VALUES (
        order_record.member_id, 
        order_record.symbol, 
        'buy', 
        order_record.quantity, 
        current_price
      );
      
      -- Update order status
      UPDATE public.pending_orders 
      SET status = 'triggered', triggered_at = NOW()
      WHERE id = order_record.id;
    END IF;
  END LOOP;
  
  -- Process limit sell orders (sell when price rises to target or above)
  FOR order_record IN 
    SELECT po.*, lm.id as member_id
    FROM public.pending_orders po
    JOIN public.league_members lm ON lm.id = po.league_member_id
    WHERE po.symbol = NEW.symbol
    AND po.order_type = 'limit_sell'
    AND po.status = 'pending'
    AND current_price >= po.target_price
  LOOP
    -- Check if user has enough shares
    IF EXISTS (
      SELECT 1 FROM public.portfolio_holdings 
      WHERE league_member_id = order_record.member_id
      AND symbol = order_record.symbol
      AND shares >= order_record.quantity
    ) THEN
      -- Execute the sell
      INSERT INTO public.trades (
        league_member_id, symbol, type, quantity, price
      ) VALUES (
        order_record.member_id, 
        order_record.symbol, 
        'sell', 
        order_record.quantity, 
        current_price
      );
      
      -- Update order status
      UPDATE public.pending_orders 
      SET status = 'triggered', triggered_at = NOW()
      WHERE id = order_record.id;
    END IF;
  END LOOP;
  
  -- Process stop-loss orders (sell when price drops to target or below)
  FOR order_record IN 
    SELECT po.*, lm.id as member_id
    FROM public.pending_orders po
    JOIN public.league_members lm ON lm.id = po.league_member_id
    WHERE po.symbol = NEW.symbol
    AND po.order_type = 'stop_loss'
    AND po.status = 'pending'
    AND current_price <= po.target_price
  LOOP
    -- Check if user has enough shares
    IF EXISTS (
      SELECT 1 FROM public.portfolio_holdings 
      WHERE league_member_id = order_record.member_id
      AND symbol = order_record.symbol
      AND shares >= order_record.quantity
    ) THEN
      -- Execute the sell
      INSERT INTO public.trades (
        league_member_id, symbol, type, quantity, price
      ) VALUES (
        order_record.member_id, 
        order_record.symbol, 
        'sell', 
        order_record.quantity, 
        current_price
      );
      
      -- Update order status
      UPDATE public.pending_orders 
      SET status = 'triggered', triggered_at = NOW()
      WHERE id = order_record.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to process orders when stock prices update
DROP TRIGGER IF EXISTS process_orders_on_price_update ON public.stock_prices;
CREATE TRIGGER process_orders_on_price_update
  AFTER UPDATE OF price ON public.stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_orders();

-- ============================================================================
-- FUNCTION: Clean up expired orders
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.pending_orders
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Pending orders table created!' as result;
SELECT '✅ RLS policies configured!' as result;
SELECT '✅ Auto-processing trigger installed!' as result;
SELECT '✅ Stop-loss and limit orders now supported!' as result;
