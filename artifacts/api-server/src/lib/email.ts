import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Talanta-Cloud EMS <onboarding@resend.dev>";

export async function sendOrgInviteEmail({
  to,
  orgName,
  inviteUrl,
  role,
}: {
  to: string;
  orgName: string;
  inviteUrl: string;
  role: string;
}) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const expiryDays = 7;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5fb;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Talanta-Cloud EMS</span>
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e1b4b;">You've been invited!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              You've been invited to join <strong style="color:#1e1b4b;">${orgName}</strong> on Talanta-Cloud EMS as <strong style="color:#6366f1;">${roleLabel}</strong>. Click the button below to accept your invitation and set up your workspace.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="border-radius:10px;background:#6366f1;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Accept Invitation →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Or copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;color:#6366f1;word-break:break-all;background:#f1f5f9;border-radius:8px;padding:10px 12px;">${inviteUrl}</p>
            <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">This invitation expires in <strong>${expiryDays} days</strong> and can only be used once. If you didn't expect this email, you can safely ignore it.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Talanta-Cloud EMS · Enterprise Employee Management</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `You've been invited to join ${orgName} on Talanta-Cloud EMS as ${roleLabel}.\n\nAccept your invitation here:\n${inviteUrl}\n\nThis link expires in ${expiryDays} days and can only be used once.`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited to join ${orgName} on Talanta-Cloud EMS`,
    html,
    text,
  });
}
