"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Sign out and redirect to login
    signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600">Logging out...</p>
      </div>
    </div>
  );
}
