"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";
import { Plus, Trash2, Save, Upload } from "lucide-react";

type MenuItem = {
  name: string;
  description: string;
  price: string;
  image?: string;
};

type Section = {
  name: string;
  items: MenuItem[];
};

export default function AdminPage() {
  const restaurantSlug = "mango-groove";

  const [restaurantName, setRestaurantName] = useState("Mango Groove");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);

    const { data } = await supabase
      .from("menus")
      .select("*")
      .eq("slug", restaurantSlug)
      .maybeSingle();

    if (data) {
      setRestaurantName(data.restaurant_name || "Mango Groove");
      setLogoUrl(data.logo_url || "");
      setBannerUrl(data.banner_url || "");
      setSections(data.menu_data?.sections || []);
    }

    setLoading(false);
  }

  async function uploadImage(file: File, folder: string) {
    const fileExt = file.name.split(".").pop();

    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("menuai-images")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return "";
    }

    const { data } = supabase.storage
      .from("menuai-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleLogoUpload(file: File) {
    const url = await uploadImage(file, "logos");
    if (url) setLogoUrl(url);
  }

  async function handleBannerUpload(file: File) {
    const url = await uploadImage(file, "banners");
    if (url) setBannerUrl(url);
  }

  async function handleDishUpload(
    file: File,
    sectionIndex: number,
    itemIndex: number
  ) {
    const url = await uploadImage(file, "dishes");
    if (!url) return;

    const updated = [...sections];
    updated[sectionIndex].items[itemIndex].image = url;
    setSections(updated);
  }

  function addSection() {
    setSections((prev) => [...prev, { name: "New Section", items: [] }]);
  }

  function updateSectionName(sectionIndex: number, value: string) {
    const updated = [...sections];
    updated[sectionIndex].name = value;
    setSections(updated);
  }

  function deleteSection(sectionIndex: number) {
    setSections((prev) => prev.filter((_, index) => index !== sectionIndex));
  }

  function addItem(sectionIndex: number) {
    const updated = [...sections];

    updated[sectionIndex].items.push({
      name: "",
      description: "",
      price: "",
      image: "",
    });

    setSections(updated);
  }

  function updateItem(
    sectionIndex: number,
    itemIndex: number,
    field: keyof MenuItem,
    value: string
  ) {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex][field] = value;
    setSections(updated);
  }

  function deleteItem(sectionIndex: number, itemIndex: number) {
    const updated = [...sections];

    updated[sectionIndex].items = updated[sectionIndex].items.filter(
      (_, index) => index !== itemIndex
    );

    setSections(updated);
  }

  async function saveMenu() {
    setSaving(true);

    const { error: menuError } = await supabase
      .from("menus")
      .update({
        restaurant_name: restaurantName,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        menu_data: { sections },
      })
      .eq("slug", restaurantSlug);

    await supabase
      .from("restaurants")
      .update({
        name: restaurantName,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      })
      .eq("slug", restaurantSlug);

    setSaving(false);

    if (menuError) {
      alert(menuError.message);
      return;
    }

    alert("Menu and branding updated successfully!");
  }

  if (loading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading admin panel...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppNav />

      <main className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-4xl font-bold">MenuAI Admin Panel</h1>
              <p className="mt-2 text-zinc-400">
                Manage menu, branding, and restaurant content
              </p>
            </div>

            <button
              onClick={saveMenu}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="mb-8 rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">Restaurant Branding</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Restaurant name"
                className="rounded-xl border border-zinc-700 bg-zinc-800 p-4"
              />

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 p-4 font-bold">
                <Upload size={20} />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 p-4 font-bold md:col-span-2">
                <Upload size={20} />
                Upload Banner
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBannerUpload(file);
                  }}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-32 w-32 rounded-full border-4 border-white object-cover"
                />
              )}

              {bannerUrl && (
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="h-40 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Menu Sections</h2>

            <button
              onClick={addSection}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold"
            >
              <Plus size={20} />
              Add Section
            </button>
          </div>

          <div className="space-y-8">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="rounded-2xl bg-zinc-900 p-6">
                <div className="mb-6 flex items-center gap-4">
                  <input
                    value={section.name}
                    onChange={(e) =>
                      updateSectionName(sectionIndex, e.target.value)
                    }
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-2xl font-bold"
                  />

                  <button
                    onClick={() => deleteSection(sectionIndex)}
                    className="rounded-xl bg-red-600 p-4"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>

                <div className="space-y-5">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="rounded-2xl bg-zinc-800 p-5">
                      <div className="mb-4 grid gap-4 md:grid-cols-2">
                        <input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(
                              sectionIndex,
                              itemIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Dish name"
                          className="rounded-xl border border-zinc-700 bg-zinc-900 p-4"
                        />

                        <input
                          value={item.price}
                          onChange={(e) =>
                            updateItem(
                              sectionIndex,
                              itemIndex,
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="Price"
                          className="rounded-xl border border-zinc-700 bg-zinc-900 p-4"
                        />
                      </div>

                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(
                            sectionIndex,
                            itemIndex,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Dish description"
                        className="mb-4 min-h-[120px] w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4"
                      />

                      <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 p-4 font-bold">
                        <Upload size={20} />
                        Upload Dish Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDishUpload(file, sectionIndex, itemIndex);
                            }
                          }}
                        />
                      </label>

                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="mb-4 h-52 w-full rounded-2xl object-cover"
                        />
                      )}

                      <button
                        onClick={() => deleteItem(sectionIndex, itemIndex)}
                        className="rounded-xl bg-red-600 px-5 py-3 font-bold"
                      >
                        Delete Dish
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(sectionIndex)}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-4 font-bold"
                  >
                    <Plus size={20} />
                    Add Dish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}