-- Check if invite codes exist for your leagues
SELECT 
    l.id as league_id,
    l.name as league_name,
    l.commissioner_id,
    li.invite_code,
    li.uses_count,
    li.max_uses
FROM leagues l
LEFT JOIN league_invites li ON li.league_id = l.id
ORDER BY l.created_at DESC;
