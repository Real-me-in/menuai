"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import AppNav from "@/components/AppNav";

type EditMenuPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter";

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState("");
  const [menuJson, setMenuJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        router.replace("/login");
        return;
      }

      const { data: menuData, error: menuError } = await supabase
        .from("menus")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (menuError || !menuData) {
        alert("Menu not found.");
        router.push("/dashboard");
        return;
      }

      if (!menuData.restaurant_id) {
        alert("This menu is not linked to a restaurant.");
        router.push("/dashboard");
        return;
      }

      const { data: roleData } = await supabase
        .from("restaurant_users")
        .select("role")
        .eq("restaurant_id", menuData.restaurant_id)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      const userRole = roleData?.role as UserRole | undefined;

      if (!userRole || !["owner", "manager"].includes(userRole)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setAuthorized(true);
      setRestaurantName(menuData.restaurant_name || "");
      setMenuJson(JSON.stringify(menuData.menu_data || {}, null, 2));
      setLoading(false);
    }

    loadMenu();
  }, [id, router]);

  async function saveMenu() {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      let parsedMenu;

      try {
        parsedMenu = JSON.parse(menuJson);
      } catch {
        alert("Invalid JSON. Please check the menu format.");
        return;
      }

      const { data: menuData, error: menuError } = await supabase
        .from("menus")
        .select("id, restaurant_id")
        .eq("id", id)
        .maybeSingle();

      if (menuError || !menuData) {
        alert("Menu not found.");
        return;
      }

      if (!menuData.restaurant_id) {
        alert("This menu is not linked to a restaurant.");
        return;
      }

      const { data: roleData } = await supabase
        .from("restaurant_users")
        .select("role")
        .eq("restaurant_id", menuData.restaurant_id)
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      const userRole = roleData?.role as UserRole | undefined;

      if (!userRole || !["owner", "manager"].includes(userRole)) {
        alert("Only owners or managers can edit menus.");
        return;
      }

      const { error } = await supabase
        .from("menus")
        .update({
          restaurant_name: restaurantName,
          menu_data: parsedMenu,
        })
        .eq("id", id)
        .eq("restaurant_id", menuData.restaurant_id);

      if (error) {
        alert("Failed to save menu: " + error.message);
        return;
      }

      alert("Menu updated successfully.");
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading menu editor...
        </main>
      </ProtectedPage>
    );
  }

  if (!authorized) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div>
            <h1 className="text-4xl font-bold text-red-500">
              Access denied
            </h1>

            <p className="mt-4 text-zinc-300">
              Only owners or managers can edit restaurant menus.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-bold text-black"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppNav />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Edit Menu</h1>

            <p className="mt-2 text-zinc-400">
              Owner/manager restaurant menu management
            </p>

            <div className="mt-3 inline-block rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
              Logged in as: {role}
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-6 shadow-xl">
            <label className="font-semibold text-zinc-300">
              Restaurant Name
            </label>

            <input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-3 text-white"
            />

            <label className="mt-6 block font-semibold text-zinc-300">
              Menu JSON
            </label>

            <textarea
              value={menuJson}
              onChange={(e) => setMenuJson(e.target.value)}
              className="mt-2 h-[500px] w-full rounded-xl border border-zinc-700 bg-black p-4 font-mono text-sm text-white"
            />

            <div className="mt-6 flex gap-4">
              <button
                onClick={saveMenu}
                disabled={saving}
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}