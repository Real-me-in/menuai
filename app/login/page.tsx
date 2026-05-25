"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function claimStaffInvite() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return false;
      }

      const res = await fetch("/api/claim-staff-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      return res.ok;
    } catch (err) {
      console.error("Claim invite error:", err);
      return false;
    }
  }

  async function completeLoginFlow() {
    await claimStaffInvite();
    router.replace("/dashboard");
  }

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await completeLoginFlow();
      }
    }

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === "SIGNED_IN" &&
          session?.user
        ) {
          await completeLoginFlow();
        }
      }
    );

    checkExistingSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "signup") {
        const { data, error } =
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMessage(
            "Account created. Please verify your email before logging in."
          );

          setLoading(false);
          return;
        }

        await completeLoginFlow();
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        await completeLoginFlow();
      }
    } catch (err: any) {
      console.error(err);
      setMessage(
        err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">
          MenuAI
        </h1>

        <p className="mt-2 text-center text-slate-500">
          {mode === "login"
            ? "Login to your restaurant dashboard"
            : "Create your MenuAI account"}
        </p>

        <form
          onSubmit={handleAuth}
          className="mt-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 6 characters"
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          {message && (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(
              mode === "login"
                ? "signup"
                : "login"
            );

            setMessage("");
          }}
          className="mt-5 w-full text-sm text-slate-600 hover:text-slate-900"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}