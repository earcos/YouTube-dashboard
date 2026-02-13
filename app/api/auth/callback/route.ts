import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRedirectUrl } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/setup?error=no_code", request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getRedirectUrl()
    );

    const { tokens } = await oauth2Client.getToken(code);

    await sql`
      INSERT INTO oauth_tokens (id, access_token, refresh_token, expiry_date, updated_at)
      VALUES (1, ${tokens.access_token}, ${tokens.refresh_token}, ${tokens.expiry_date}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW()
    `;

    return NextResponse.redirect(new URL("/?connected=true", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/setup?error=auth_failed", request.url)
    );
  }
}
