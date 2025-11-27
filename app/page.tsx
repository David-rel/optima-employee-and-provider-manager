import { requireAuth } from "@/lib/with-auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await requireAuth();

  // Fetch and console log all users
  try {
    const usersResult = await query(
      "SELECT id, name, email, email_verified, role, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    console.log("=== ALL USERS ===");
    console.log(JSON.stringify(usersResult.rows, null, 2));
    console.log("=================");

    // Check email verification status from database using user ID directly
    let currentUser: { email_verified: boolean } | null = null;
    if (session.user?.id) {
      const userResult = await query<{ email_verified: boolean }>(
        "SELECT email_verified FROM users WHERE id = $1",
        [parseInt(session.user.id)]
      );
      currentUser = userResult.rows[0] || null;
    }

    console.log("Current user from DB (by ID):", currentUser);
    console.log("Session user ID:", session.user?.id);
    console.log("Session email:", session.user?.email);
    console.log("Session emailVerified:", session.user?.emailVerified);
    console.log("DB email_verified:", currentUser?.email_verified);

    // Server-side redirect if email not verified (trust database, not session)
    // Only redirect if explicitly false - if true or undefined, allow access
    if (currentUser && currentUser.email_verified === false) {
      console.log("Redirecting to verify-email (email not verified in DB)");
      redirect("/verify-email");
    }
    // If email_verified is true or undefined/null, allow access
    // This ensures that once verified in DB, user can access even if session hasn't refreshed
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-[#003366] mb-4">
          Welcome, {session.user?.name || session.user?.email}!
        </h1>
        <p className="text-slate-600 mb-2">
          <span className="font-semibold">Email:</span> {session.user?.email}
        </p>
        {session.user?.role && (
          <p className="text-slate-600 mb-2">
            <span className="font-semibold">Role:</span>{" "}
            <span className="capitalize">{session.user.role}</span>
          </p>
        )}
        <p className="text-sm text-slate-500 mt-4">
          This is your protected dashboard. All routes are protected and require
          authentication and email verification.
        </p>
      </div>
    </div>
  );
}
