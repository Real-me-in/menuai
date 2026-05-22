"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful. Check your email if confirmation is required.");
    }
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-4xl font-bold text-green-800">MenuAI Login</h1>

        <p className="mt-3 text-gray-600">
          Login or create a restaurant owner account.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-gray-300 p-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-gray-300 p-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Login
          </button>

          <button
            onClick={signUp}
            className="w-full rounded-xl border border-green-600 px-6 py-3 font-semibold text-green-700 hover:bg-green-50"
          >
            Create Account
          </button>
        </div>
      </div>
    </main>
  );
}