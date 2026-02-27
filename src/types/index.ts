// WallStreet Fantasy Type Definitions

export interface Profile {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  commissioner_id: string;
  commissioner?: Profile;
  
  // Settings
  starting_balance: number;
  season_length_days: number;
  max_players: number;
  trade_limit_per_day: number;
  allow_fractional_shares: boolean;
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'completed';
  season_start_date?: string;
  season_end_date?: string;
  
  // Member count
  member_count?: number;
  
  created_at: string;
  updated_at: string;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  user?: Profile;
  
  status: 'pending' | 'active' | 'removed';
  joined_at: string;
  
  // Portfolio
  cash_balance: number;
  total_value: number;
  total_return: number;
  total_return_percent: number;
  
  // Rankings
  current_rank?: number;
  previous_rank?: number;
}

export interface PortfolioHolding {
  id: string;
  league_member_id: string;
  
  symbol: string;
  company_name?: string;
  
  shares: number;
  average_cost: number;
  
  current_price?: number;
  current_value?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percent?: number;
  
  last_updated?: string;
}

export interface Trade {
  id: string;
  league_member_id: string;
  
  symbol: string;
  company_name?: string;
  trade_type: 'buy' | 'sell';
  shares: number;
  price_per_share: number;
  total_amount: number;
  
  status: 'pending' | 'completed' | 'failed';
  executed_at: string;
  created_at: string;
}

export interface LeagueInvite {
  id: string;
  league_id: string;
  invited_by: string;
  
  invite_code: string;
  email?: string;
  max_uses: number;
  uses_count: number;
  
  expires_at?: string;
  created_at: string;
}

export interface StockPrice {
  id: string;
  symbol: string;
  company_name?: string;
  
  current_price: number;
  previous_close: number;
  change_amount: number;
  change_percent: number;
  
  last_updated: string;
}

export interface CreateLeagueInput {
  name: string;
  description?: string;
  starting_balance?: number;
  season_length_days?: number;
  max_players?: number;
  trade_limit_per_day?: number;
  allow_fractional_shares?: boolean;
}

export interface ExecuteTradeInput {
  symbol: string;
  trade_type: 'buy' | 'sell';
  shares: number;
}
