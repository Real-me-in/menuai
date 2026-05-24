"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-50 p-6">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-10 shadow-2xl">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-5xl font-extrabold text-green-700">
            Mango Groove
          </h1>

          <p className="text-lg text-gray-600">
            AI Powered Smart Restaurant Platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/menu/mango-groove?admin=true"
            className="rounded-2xl bg-green-600 p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-green-700"
          >
            Menu
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl bg-black p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105"
          >
            Dashboard
          </Link>

          <Link
            href="/kitchen"
            className="rounded-2xl bg-orange-500 p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"
          >
            Kitchen
          </Link>

          <Link
            href="/analytics"
            className="rounded-2xl bg-blue-600 p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
          >
            Analytics
          </Link>

          <Link
            href="/billing"
            className="rounded-2xl bg-purple-600 p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-purple-700"
          >
            Billing
          </Link>

          <Link
            href="/login"
            className="rounded-2xl bg-zinc-700 p-8 text-center text-2xl font-bold text-white shadow-lg transition hover:scale-105 hover:bg-zinc-800"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}