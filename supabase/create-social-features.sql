-- ============================================================================
-- SOCIAL FEATURES: Chat, Comments, and Activity Feed
-- ============================================================================

-- ============================================================================
-- 1. LEAGUE CHAT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.league_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.league_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: League members can view chat
CREATE POLICY "League members can view chat" 
  ON public.league_chat_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.league_id = league_chat_messages.league_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- Policy: League members can send messages
CREATE POLICY "League members can send messages" 
  ON public.league_chat_messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.league_id = league_chat_messages.league_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- Policy: Users can edit their own messages
CREATE POLICY "Users can edit own messages" 
  ON public.league_chat_messages FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" 
  ON public.league_chat_messages FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 2. TRADE COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trade_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;

-- Policy: League members can view trade comments
CREATE POLICY "League members can view trade comments" 
  ON public.trade_comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      JOIN public.league_members lm ON lm.id = t.league_member_id
      WHERE t.id = trade_comments.trade_id
      AND lm.user_id = auth.uid()
    )
  );

-- Policy: League members can comment on trades
CREATE POLICY "League members can comment" 
  ON public.trade_comments FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trades t
      JOIN public.league_members lm ON lm.id = t.league_member_id
      WHERE t.id = trade_comments.trade_id
      AND lm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ACTIVITY FEED
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('trade', 'join', 'achievement', 'rank_change', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Policy: League members can view activity
CREATE POLICY "League members can view activity" 
  ON public.activity_feed FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.league_members 
      WHERE league_members.league_id = activity_feed.league_id 
      AND league_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. TRIGGERS FOR AUTO-ACTIVITY
-- ============================================================================

-- Trigger: Add activity when trade is made
CREATE OR REPLACE FUNCTION add_trade_activity()
RETURNS TRIGGER AS $$
DECLARE
  league_id_var UUID;
  user_id_var UUID;
  username_var TEXT;
  symbol_var TEXT;
BEGIN
  -- Get league_id and user_id
  SELECT lm.league_id, lm.user_id, p.username, NEW.symbol
  INTO league_id_var, user_id_var, username_var, symbol_var
  FROM public.league_members lm
  JOIN public.profiles p ON p.id = lm.user_id
  WHERE lm.id = NEW.league_member_id;

  -- Add to activity feed
  INSERT INTO public.activity_feed (league_id, user_id, activity_type, title, description, metadata)
  VALUES (
    league_id_var,
    user_id_var,
    'trade',
    CASE 
      WHEN NEW.type = 'buy' THEN 'Bought ' || symbol_var
      ELSE 'Sold ' || symbol_var
    END,
    username_var || ' ' || NEW.type || ' ' || NEW.quantity || ' shares of ' || symbol_var || ' at $' || NEW.price,
    jsonb_build_object(
      'symbol', symbol_var,
      'type', NEW.type,
      'quantity', NEW.quantity,
      'price', NEW.price
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trade_activity ON public.trades;
CREATE TRIGGER on_trade_activity
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION add_trade_activity();

-- Trigger: Add activity when user joins league
CREATE OR REPLACE FUNCTION add_join_activity()
RETURNS TRIGGER AS $$
DECLARE
  username_var TEXT;
BEGIN
  SELECT username INTO username_var
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.activity_feed (league_id, user_id, activity_type, title, description)
  VALUES (
    NEW.league_id,
    NEW.user_id,
    'join',
    'New Member Joined',
    username_var || ' joined the league!'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_join_activity ON public.league_members;
CREATE TRIGGER on_join_activity
  AFTER INSERT ON public.league_members
  FOR EACH ROW
  EXECUTE FUNCTION add_join_activity();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ League chat table created!' as result;
SELECT '✅ Trade comments table created!' as result;
SELECT '✅ Activity feed table created!' as result;
SELECT '✅ Auto-activity triggers installed!' as result;
SELECT '✅ Social features ready!' as result;
