"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signUp() {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Account created successfully.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-bold text-green-700">
          Restaurant Owner Login
        </h1>

        <p className="mt-2 text-gray-600">
          Login or create your MenuAI account.
        </p>

        <div className="mt-8 space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-3"
          />

          <div className="flex gap-4">
            <button
              onClick={login}
              disabled={loading}
              className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Login
            </button>

            <button
              onClick={signUp}
              disabled={loading}
              className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white"
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-gray-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}