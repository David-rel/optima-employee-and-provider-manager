"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AppLayout } from "./app-layout";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't need authentication
  const publicRoutes = ["/login", "/verify-email", "/logout"];

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    // Debug logging
    console.log("AuthGuard - Status:", status);
    console.log("AuthGuard - Session:", session);
    console.log("AuthGuard - Pathname:", pathname);
    console.log("AuthGuard - EmailVerified:", session?.user?.emailVerified);

    // If not authenticated, redirect to login
    if (status === "unauthenticated" && !publicRoutes.includes(pathname)) {
      router.push("/login");
      return;
    }

    // If authenticated but email not verified, redirect to verify-email
    // But allow dashboard to do its own database check first (server-side)
    const emailVerified = session?.user?.emailVerified;
    if (
      status === "authenticated" &&
      session &&
      (emailVerified === false || emailVerified === undefined) &&
      !publicRoutes.includes(pathname) &&
      pathname !== "/verify-email" &&
      pathname !== "/" // Let dashboard handle its own redirect
    ) {
      console.log("AuthGuard - Redirecting to verify-email");
      router.push("/verify-email");
      return;
    }

    // If on verify-email page but email is verified, redirect to home
    if (
      status === "authenticated" &&
      session?.user?.emailVerified &&
      pathname === "/verify-email"
    ) {
      router.push("/");
      return;
    }

    // If on login page but authenticated, redirect to home or verify-email
    if (status === "authenticated" && session && pathname === "/login") {
      if (session.user?.emailVerified) {
        router.push("/");
      } else {
        router.push("/verify-email");
      }
      return;
    }
  }, [status, session, router, pathname]);

  // Don't render anything while checking
  if (status === "loading") {
    return null;
  }

  // Wrap authenticated routes (non-public) with AppLayout
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthenticated = status === "authenticated" && session;

  if (isAuthenticated && !isPublicRoute) {
    return <AppLayout>{children}</AppLayout>;
  }

  // For public routes or unauthenticated state, render children directly
  return <>{children}</>;
}
