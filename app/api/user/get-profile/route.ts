import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const result = await query<{
      id: number;
      name: string;
      email: string;
      phone_number: string | null;
      location: string | null;
      user_image_url: string | null;
      role: string;
      email_verified: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      "SELECT id, name, email, phone_number, location, user_image_url, role, email_verified, created_at, updated_at FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
