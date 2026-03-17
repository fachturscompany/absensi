import { logger } from '@/lib/logger';

/**
 * Email Service
 * 
 * OPTION 1: Supabase Built-in Email (RECOMMENDED)
 * OPTION 2: Resend (for more customization)
 */

interface SendInvitationEmailParams {
  to: string;
  organizationName: string;
  inviterName: string;
  invitationToken: string;
  message?: string;
}

// ============================================
// OPTION 1: SUPABASE BUILT-IN EMAIL
// ============================================

/**
 * Send invitation using Supabase's built-in inviteUserByEmail()
 * This uses Supabase Auth email templates - NO third-party service needed!
 * 
 * Benefits:
 * - Free (included in Supabase)
 * - Auto-managed by Supabase
 * - Customizable templates in Supabase Dashboard
 * - No API key needed
 * 
 * Setup:
 * 1. Go to: Supabase Dashboard → Authentication → Email Templates
 * 2. Customize "Invite user" template
 * 3. Use this function
 */
export async function sendInvitationEmailViaSupabase({
  to,
  invitationToken,
  organizationName,
  message,
}: {
  to: string;
  invitationToken: string;
  organizationName?: string;
  message?: string;
}) {
  try {
    // Import admin client (with service_role key)
    const { createAdminClient } = await import("@/utils/supabase/admin");
    const supabase = createAdminClient();

    // Check if email already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === to.toLowerCase()
    );

    if (userExists) {
      // User already registered - Supabase inviteUserByEmail won't work
      logger.warn(`Email ${to} already registered. Skipping Supabase invite email.`);
      return {
        success: false,
        message: "Email already registered. User must be added manually to organization.",
        skipEmail: true, // Flag to indicate email was skipped, not failed
      };
    }

    // Use Supabase's inviteUserByEmail (only works for NEW users)
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(to, {
      // Redirect to our custom acceptance page
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${invitationToken}`,
      // Pass metadata (accessible in email template)
      data: {
        organization_name: organizationName,
        invitation_message: message,
        invitation_token: invitationToken,
      },
    });

    if (error) {
      logger.error("Supabase invitation email error:", error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Error sending Supabase invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// OPTION 2: RESEND (for custom HTML emails)
// ============================================

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  invitationToken,
  message,
}: SendInvitationEmailParams) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not found, skipping email");
    return { success: false, message: "Email service not configured" };
  }

  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${invitationToken}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use resend.dev for testing, change to your domain later
        to: [to],
        subject: `You're invited to join ${organizationName}`,
        html: generateInvitationEmailHTML({
          organizationName,
          inviterName,
          invitationLink,
          message,
        }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("Resend API error:", data);
      return { success: false, message: data.message || "Failed to send email" };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Error sending email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateInvitationEmailHTML({
  organizationName,
  inviterName,
  invitationLink,
  message,
}: {
  organizationName: string;
  inviterName: string;
  invitationLink: string;
  message?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited! 🎉</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on our attendance management platform.
    </p>
    
    ${message ? `
      <div style="background: #f3f4f6; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-style: italic; color: #4b5563;">"${message}"</p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationLink}" 
         style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 13px; color: #667eea; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 4px;">
      ${invitationLink}
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 13px; color: #9ca3af; margin: 0;">
        This invitation will expire in <strong>7 days</strong>. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px;">
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      © ${new Date().getFullYear()} ${organizationName}. All rights reserved.
    </p>
  </div>
  
</body>
</html>
  `.trim();
}

// Reminder email untuk invitation yang akan expire
export async function sendInvitationReminderEmail({
  to,
  organizationName,
  invitationToken,
  expiresInDays,
}: {
  to: string;
  organizationName: string;
  invitationToken: string;
  expiresInDays: number;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return { success: false, message: "Email service not configured" };
  }

  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${invitationToken}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [to],
        subject: `Reminder: Your invitation to ${organizationName} expires soon`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>⏰ Reminder: Invitation Expiring Soon</h2>
  <p>Your invitation to join <strong>${organizationName}</strong> will expire in <strong>${expiresInDays} day${expiresInDays > 1 ? 's' : ''}</strong>.</p>
  <p>Don't miss out! Accept your invitation now:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${invitationLink}" 
       style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
      Accept Invitation Now
    </a>
  </div>
</body>
</html>
        `,
      }),
    });

    const data = await response.json();
    return response.ok ? { success: true, data } : { success: false, message: data.message };
  } catch (error) {
    logger.error("Error sending reminder:", error);
    return { success: false, message: "Failed to send reminder" };
  }
}
