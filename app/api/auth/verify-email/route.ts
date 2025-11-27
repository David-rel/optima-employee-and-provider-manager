import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Get user's stored code
    const result = await query<{
      email_code: string | null;
      email_verified: boolean;
    }>("SELECT email_code, email_verified FROM users WHERE id = $1", [
      parseInt(session.user.id),
    ]);

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email_verified) {
      return NextResponse.json({
        message: "Email already verified",
      });
    }

    if (!user.email_code || user.email_code !== code.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Verify email and clear code
    await query(
      "UPDATE users SET email_verified = true, email_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [parseInt(session.user.id)]
    );

    // Return success - session will refresh on next request
    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
