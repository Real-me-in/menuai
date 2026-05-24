"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppNav() {
  const router = useRouter();

  const restaurantSlug = "mango-groove";

  function logout() {
    localStorage.removeItem("menuai_logged_in");

    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold">
          MenuAI
        </Link>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/"
            className="rounded-lg bg-zinc-800 px-3 py-2"
          >
            Home
          </Link>

          <Link
            href="/admin"
            className="rounded-lg bg-blue-600 px-3 py-2"
          >
            Admin
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-purple-600 px-3 py-2"
          >
            Dashboard
          </Link>

          <Link
            href="/kitchen"
            className="rounded-lg bg-green-600 px-3 py-2"
          >
            Kitchen
          </Link>

          <Link
            href="/orders"
            className="rounded-lg bg-red-600 px-3 py-2"
          >
            Orders
          </Link>

          <Link
            href={`/menu/${restaurantSlug}`}
            className="rounded-lg bg-yellow-500 px-3 py-2 text-black"
          >
            Menu
          </Link>

          <Link
            href="/qr"
            className="rounded-lg bg-orange-500 px-3 py-2 text-black"
          >
            QR Code
          </Link>

          <button
            onClick={logout}
            className="rounded-lg bg-zinc-700 px-3 py-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}