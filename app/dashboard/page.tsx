"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MenuItem = {
  name: string;
  description: string;
  price: string;
  image?: string;
};

type MenuSection = {
  name: string;
  items: MenuItem[];
};

export default function DashboardPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("green-leaf-restaurant");
  const [logoUrl, setLogoUrl] = useState("");
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchMenu();
  }, []);

  const publicMenuUrl =
    mounted && slug ? `${window.location.origin}/menu/${slug}` : "";

  async function fetchMenu() {
    const { data } = await supabase
      .from("menus")
      .select("*")
      .eq("slug", "green-leaf-restaurant")
      .single();

    if (data) {
      setRestaurantName(data.restaurant_name || "");
      setSlug(data.slug || "");
      setLogoUrl(data.logo_url || "");
      setSections(data.menu_data?.sections || []);
    }
  }

  async function handleSave() {
    setLoading(true);

    const { data, error } = await supabase
      .from("menus")
      .update({
        restaurant_name: restaurantName,
        slug,
        logo_url: logoUrl,
        menu_data: { sections },
      })
      .eq("slug", "green-leaf-restaurant")
      .select();

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("No menu row was updated");
      return;
    }

    alert("Saved successfully");
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("restaurant-logos")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("restaurant-logos")
      .getPublicUrl(fileName);

    setLogoUrl(data.publicUrl);
  }

  async function handleFoodImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number,
    itemIndex: number
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${sectionIndex}-${itemIndex}.${fileExt}`;

    const { error } = await supabase.storage
      .from("menu-item-images")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("menu-item-images")
      .getPublicUrl(fileName);

    const updated = [...sections];
    updated[sectionIndex].items[itemIndex].image = data.publicUrl;
    setSections(updated);
  }

  function addSection() {
    setSections([...sections, { name: "New Category", items: [] }]);
  }

  function updateSectionName(sectionIndex: number, value: string) {
    const updated = [...sections];
    updated[sectionIndex].name = value;
    setSections(updated);
  }

  function deleteSection(sectionIndex: number) {
    setSections(sections.filter((_, index) => index !== sectionIndex));
  }

  function addItem(sectionIndex: number) {
    const updated = [...sections];

    updated[sectionIndex].items.push({
      name: "New Dish",
      description: "Dish description",
      price: "0",
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

  function downloadQR() {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");

      downloadLink.download = "menu-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-green-700">
          MenuAI Dashboard
        </h1>

        <p className="mb-8 text-gray-600">
          Manage branding, QR code, menu items and food images
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-semibold">
              Restaurant Branding
            </h2>

            <label className="mb-2 block font-medium">Restaurant Name</label>
            <input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="mb-5 w-full rounded-xl border p-4"
            />

            <label className="mb-2 block font-medium">Public Menu Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mb-5 w-full rounded-xl border p-4"
            />

            <label className="mb-2 block font-medium">
              Upload Restaurant Logo
            </label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />

            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="mt-4 h-24 w-24 rounded-full border object-cover"
              />
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-semibold">QR Menu Access</h2>

            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <div className="inline-block rounded-2xl bg-white p-4 shadow">
                {mounted && slug && (
                  <QRCode id="qr-code" value={publicMenuUrl} size={220} />
                )}
              </div>

              <p className="mt-5 break-all text-sm text-gray-600">
                {publicMenuUrl || "Loading menu link..."}
              </p>

              <button
                onClick={downloadQR}
                className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Visual Menu Editor</h2>

            <button
              onClick={addSection}
              className="rounded-xl bg-green-600 px-5 py-3 text-white"
            >
              + Add Category
            </button>
          </div>

          <div className="space-y-8">
            {sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="rounded-2xl border bg-gray-50 p-5"
              >
                <div className="mb-5 flex gap-3">
                  <input
                    value={section.name}
                    onChange={(e) =>
                      updateSectionName(sectionIndex, e.target.value)
                    }
                    className="flex-1 rounded-xl border p-3 text-xl font-semibold"
                  />

                  <button
                    onClick={() => addItem(sectionIndex)}
                    className="rounded-xl bg-black px-4 py-2 text-white"
                  >
                    + Item
                  </button>

                  <button
                    onClick={() => deleteSection(sectionIndex)}
                    className="rounded-xl bg-red-600 px-4 py-2 text-white"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="rounded-xl bg-white p-4 shadow-sm"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="mb-4 h-40 w-full rounded-xl object-cover"
                        />
                      )}

                      <div className="mb-3">
                        <label className="mb-2 block text-sm font-medium">
                          Upload Food Image
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFoodImageUpload(e, sectionIndex, itemIndex)
                          }
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
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
                          className="rounded-lg border p-3"
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
                          className="rounded-lg border p-3"
                        />

                        <button
                          onClick={() => deleteItem(sectionIndex, itemIndex)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-white"
                        >
                          Delete Item
                        </button>
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
                        className="mt-3 w-full rounded-lg border p-3"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-8 rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white"
          >
            {loading ? "Saving..." : "Save Full Menu"}
          </button>
        </div>
      </div>
    </div>
  );
}