"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already verified or not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.emailVerified) {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  // No auto-send - user must click button to send verification email

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      setSuccess("Email verified successfully! Refreshing session...");

      // Update session to refresh emailVerified status
      await update();

      // Use window.location.replace for hard redirect (forces fresh page load)
      // Dashboard checks database directly, so it will allow access even if session hasn't refreshed
      setTimeout(() => {
        window.location.replace("/");
      }, 1000);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification code");
        setIsSending(false);
        return;
      }

      setSuccess("Verification code sent! Check your email.");
      setIsSending(false);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setIsSending(false);
    }
  };

  // Don't render if redirecting
  if (status !== "authenticated" || session?.user?.emailVerified) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center relative">
              <div className="relative">
                <span className="text-7xl font-bold text-[#003366] relative inline-block">
                  O
                </span>
                <svg
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 pointer-events-none"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 8 24 L 14 18 L 18 22 L 22 20 L 26 24 L 30 16 L 34 24 L 38 20 L 42 24"
                    stroke="#5BA3D0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-7xl font-bold text-[#003366] ml-[-6px]">
                  ptima
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#003366] mb-2">Optima</h1>
          <p className="text-[#5BA3D0] text-sm uppercase tracking-[0.3em] font-medium">
            MEDICAL
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-semibold text-[#003366] mb-2 text-center">
            Verify Your Email
          </h2>
          <p className="text-slate-600 text-center mb-6 text-sm">
            Enter the verification code sent to{" "}
            <span className="font-semibold">{session?.user?.email}</span>
          </p>

          {/* Send Verification Code Button */}
          {!code && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="w-full bg-[#5BA3D0] text-white py-3 rounded-lg font-semibold hover:bg-[#4a8bb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 text-center">{success}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5BA3D0] focus:border-[#5BA3D0] outline-none transition-colors text-slate-900 text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-[#003366] text-white py-3 rounded-lg font-semibold hover:bg-[#002244] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {code && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="text-sm text-[#5BA3D0] hover:text-[#003366] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Resend Code"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
