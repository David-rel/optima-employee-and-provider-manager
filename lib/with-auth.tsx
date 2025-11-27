import { redirect } from "next/navigation";
import { getSession } from "./get-session";

/**
 * Higher-order component to protect pages with authentication
 * Use this to wrap page components that require authentication
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
