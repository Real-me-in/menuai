"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">(
    "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert(
        "Account created successfully. Please login now."
      );

      setMode("login");
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found");
      return;
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      router.push("/onboarding");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">MenuAI</h1>

          <p className="mt-2 text-zinc-400">
            Restaurant SaaS Platform
          </p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-zinc-800 p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl py-3 font-bold transition ${
              mode === "login"
                ? "bg-green-600 text-white"
                : "text-zinc-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-xl py-3 font-bold transition ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "text-zinc-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Email
            </label>

            <input
              type="email"
              placeholder="owner@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4 outline-none transition focus:border-green-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-4 outline-none transition focus:border-green-500"
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading}
            className={`w-full rounded-2xl py-4 text-lg font-bold transition ${
              mode === "login"
                ? "bg-green-600 hover:bg-green-500"
                : "bg-blue-600 hover:bg-blue-500"
            } disabled:opacity-50`}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-black p-5">
          <div className="mb-3 text-sm font-bold text-zinc-400">
            MenuAI Features
          </div>

          <div className="space-y-2 text-sm text-zinc-500">
            <div>• QR Menu Ordering</div>
            <div>• Kitchen Display System</div>
            <div>• Real-time Orders</div>
            <div>• Billing & Receipts</div>
            <div>• Restaurant Analytics</div>
          </div>
        </div>
      </div>
    </main>
  );
}