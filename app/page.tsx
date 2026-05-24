import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function HomePage() {
  return (
    <>
      <AppNav />

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-6 text-6xl font-bold">
            MenuAI
          </h1>

          <p className="mb-12 max-w-2xl text-xl text-zinc-400">
            AI-powered restaurant ordering, kitchen
            management, analytics, and smart customer
            experience platform.
          </p>

          <div className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/menu/mango-groove"
              className="rounded-2xl bg-green-600 p-8 text-2xl font-bold transition hover:scale-105"
            >
              Customer Menu
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl bg-blue-600 p-8 text-2xl font-bold transition hover:scale-105"
            >
              Admin Panel
            </Link>

            <Link
              href="/dashboard"
              className="rounded-2xl bg-purple-600 p-8 text-2xl font-bold transition hover:scale-105"
            >
              Analytics Dashboard
            </Link>

            <Link
              href="/kitchen"
              className="rounded-2xl bg-yellow-500 p-8 text-2xl font-bold text-black transition hover:scale-105"
            >
              Kitchen Display
            </Link>

            <Link
              href="/orders"
              className="rounded-2xl bg-red-600 p-8 text-2xl font-bold transition hover:scale-105"
            >
              Orders
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-zinc-700 p-8 text-2xl font-bold transition hover:scale-105"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}