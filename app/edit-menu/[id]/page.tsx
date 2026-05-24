"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type EditMenuPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [menuRecord, setMenuRecord] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [menuJson, setMenuJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Menu not found.");
        router.push("/dashboard");
        return;
      }

      setMenuRecord(data);
      setRestaurantName(data.restaurant_name);
      setMenuJson(JSON.stringify(data.menu_data, null, 2));
      setLoading(false);
    }

    loadMenu();
  }, [id, router]);

  async function saveMenu() {
    try {
      setSaving(true);

      const parsedMenu = JSON.parse(menuJson);

      const { error } = await supabase
        .from("menus")
        .update({
          restaurant_name: restaurantName,
          menu_data: parsedMenu,
        })
        .eq("id", id);

      if (error) {
        alert("Failed to save menu.");
        return;
      }

      alert("Menu updated successfully.");
      router.push("/dashboard");
    } catch (error) {
      alert("Invalid JSON. Please check the menu format.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <h1 className="text-3xl font-bold">Loading menu editor...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-green-800">
          Edit Menu
        </h1>

        <p className="mt-2 text-gray-600">
          Update restaurant name and menu data.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <label className="font-semibold text-gray-700">
            Restaurant Name
          </label>

          <input
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 p-3"
          />

          <label className="mt-6 block font-semibold text-gray-700">
            Menu JSON
          </label>

          <textarea
            value={menuJson}
            onChange={(e) => setMenuJson(e.target.value)}
            className="mt-2 h-[500px] w-full rounded-xl border border-gray-300 p-4 font-mono text-sm"
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
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}