"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMenus(data);
      }

      setLoading(false);
    }

    loadMenus();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <h1 className="text-3xl font-bold">Loading your menus...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-green-800">
              My Menus
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your restaurant digital menus.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
            >
              Create New Menu
            </Link>

            <button
              onClick={logout}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold">No menus yet</h2>
            <p className="mt-2 text-gray-600">
              Create your first AI-powered menu.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="rounded-3xl bg-white p-6 shadow-xl"
              >
                <h2 className="text-2xl font-bold text-green-800">
                  {menu.restaurant_name}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  /menu/{menu.slug}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={`/menu/${menu.slug}`}
                    target="_blank"
                    className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white"
                  >
                    View Public Menu
                  </Link>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/menu/${menu.slug}`
                      );
                      alert("Menu link copied!");
                    }}
                    className="rounded-xl border border-green-600 px-5 py-3 font-semibold text-green-700"
                  >
                    Copy Menu Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}