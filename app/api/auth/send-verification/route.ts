import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { query } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await query(
      "UPDATE users SET email_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [code, parseInt(session.user.id)]
    );

    // Send verification email
    await sendVerificationEmail(
      session.user.email,
      session.user.name || "User",
      code
    );

    return NextResponse.json({
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
