
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.replace("/");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };

      const errors: Record<string, string> = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must contain at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection.",
      };

      setError(
        errors[firebaseError.code ?? ""] ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch {
      setError("Unable to send reset email. Please check your email address.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8f7] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#e3ebe6] bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#087a50] text-3xl font-bold text-white">
            Z
          </div>

          <h1 className="text-3xl font-bold text-[#14231e]">
            ZevaSewa
          </h1>

          <p className="mt-2 text-sm text-[#718078]">
            Smart Business Management
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#f1f6f3] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`rounded-lg py-3 text-sm font-semibold ${
              mode === "login"
                ? "bg-white text-[#087a50] shadow-sm"
                : "text-[#718078]"
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`rounded-lg py-3 text-sm font-semibold ${
              mode === "register"
                ? "bg-white text-[#087a50] shadow-sm"
                : "text-[#718078]"
            }`}
          >
            Create Account
          </button>
        </div>

        <h2 className="mb-2 text-xl font-bold text-[#14231e]">
          {mode === "login" ? "Welcome back!" : "Create your account"}
        </h2>

        <p className="mb-6 text-sm text-[#718078]">
          {mode === "login"
            ? "Sign in to access your business workspace."
            : "Start managing your business with ZevaSewa."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#14231e]"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#dce7e0] px-4 py-3 outline-none focus:border-[#087a50] focus:ring-2 focus:ring-[#087a50]/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#14231e]"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-[#dce7e0] px-4 py-3 outline-none focus:border-[#087a50] focus:ring-2 focus:ring-[#087a50]/10"
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                className="text-sm font-medium text-[#087a50] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#087a50] py-3.5 font-semibold text-white hover:bg-[#066441] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#718078]">
          Your business workspace is protected by Firebase Authentication.
        </p>
      </section>
    </main>
  );
}
