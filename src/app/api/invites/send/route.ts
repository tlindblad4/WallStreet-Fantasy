import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Simple email sending using fetch to email API
// You can replace this with SendGrid, Resend, AWS SES, etc.
async function sendInviteEmail(to: string, leagueName: string, inviteCode: string, inviterName: string) {
  // For now, we'll log the email and return success
  // In production, integrate with your email provider:
  // - Resend: https://resend.com
  // - SendGrid: https://sendgrid.com
  // - AWS SES
  // - Mailgun
  
  const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://wall-street-fantasy.vercel.app"}/leagues/join?code=${inviteCode}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">WallStreet Fantasy</h1>
      </div>
      
      <div style="background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #27272a;">
        <h2 style="margin-top: 0; color: #fff;">You've Been Invited!</h2>
        
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          <strong style="color: #fff;">${inviterName}</strong> has invited you to join their fantasy stock trading league 
          <strong style="color: #10b981;">"${leagueName}"</strong> on WallStreet Fantasy!
        </p>
        
        <div style="background: #0a0a0a; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px solid #27272a;">
          <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Invite Code</p>
          <code style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px;">${inviteCode}</code>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${joinUrl}" 
             style="display: inline-block; background: #10b981; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 14px; margin-top: 25px;">
          Or copy and paste this link into your browser:<br>
          <a href="${joinUrl}" style="color: #10b981; word-break: break-all;">${joinUrl}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #27272a;">
        <p style="color: #52525b; font-size: 12px;">
          WallStreet Fantasy · Fantasy Sports for Stocks<br>
          Trade stocks & crypto with friends in private leagues
        </p>
      </div>
    </div>
  `;

  // TODO: Replace with your email provider
  // Example using Resend:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'WallStreet Fantasy <invites@wallstreetfantasy.com>',
  //     to,
  //     subject: `You've been invited to join ${leagueName} on WallStreet Fantasy`,
  //     html: emailHtml,
  //   }),
  // });

  console.log(`📧 Email would be sent to: ${to}`);
  console.log(`Subject: You've been invited to join ${leagueName} on WallStreet Fantasy`);
  
  // For demo purposes, always return success
  // In production, return the actual result from your email provider
  return { success: true, message: "Email queued for sending" };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  try {
    const { leagueId, emails } = await request.json();

    if (!leagueId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "League ID and email addresses required" }, { status: 400 });
    }

    // Validate emails
    const validEmails = emails.filter((email: string) => 
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "No valid email addresses provided" }, { status: 400 });
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single();

    const inviterName = profile?.display_name || profile?.username || "A friend";

    // Get league info
    const { data: league } = await supabase
      .from("leagues")
      .select("name, invite_code:league_invites(invite_code)")
      .eq("id", leagueId)
      .single();

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Get or create invite code
    let inviteCode = league.invite_code?.[0]?.invite_code;
    
    if (!inviteCode) {
      // Generate new invite code
      inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error: inviteError } = await supabase
        .from("league_invites")
        .insert({
          league_id: leagueId,
          invited_by: user.id,
          invite_code: inviteCode,
          max_uses: 100,
        });

      if (inviteError) throw inviteError;
    }

    // Send emails
    const results = [];
    for (const email of validEmails) {
      try {
        const result = await sendInviteEmail(email, league.name, inviteCode, inviterName);
        results.push({ email, success: result.success });
      } catch (error) {
        results.push({ email, success: false, error: "Failed to send" });
      }
    }

    const successful = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      sent: successful,
      total: validEmails.length,
      inviteCode,
      results,
    });
  } catch (error: any) {
    console.error("Invite email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
