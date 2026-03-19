-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trade', 'league', 'achievement', 'market')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can only update their own notifications
CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications" 
  ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- TRIGGER: Create notification when user joins league
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_user_joined_league()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the new member
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.user_id,
    'league',
    'Welcome to the league!',
    'You have successfully joined a new league. Start trading to compete!'
  );
  
  -- Notify the commissioner
  INSERT INTO public.notifications (user_id, type, title, message)
  SELECT 
    l.commissioner_id,
    'league',
    'New member joined',
    'A new player has joined your league!'
  FROM public.leagues l
  WHERE l.id = NEW.league_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_joined ON public.league_members;
CREATE TRIGGER on_member_joined
  AFTER INSERT ON public.league_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_joined_league();

-- ============================================================================
-- TRIGGER: Create notification on trade completion
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_trade_completed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    (SELECT user_id FROM public.league_members WHERE id = NEW.league_member_id),
    'trade',
    CASE 
      WHEN NEW.type = 'buy' THEN 'Stock Purchase Completed'
      ELSE 'Stock Sale Completed'
    END,
    'You ' || NEW.type || ' ' || NEW.quantity || ' shares of ' || NEW.symbol || ' at $' || NEW.price,
    jsonb_build_object(
      'symbol', NEW.symbol,
      'type', NEW.type,
      'quantity', NEW.quantity,
      'price', NEW.price
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trade_completed ON public.trades;
CREATE TRIGGER on_trade_completed
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_trade_completed();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Notifications table created!' as result;
SELECT '✅ RLS policies configured!' as result;
SELECT '✅ Auto-notification triggers installed!' as result;
