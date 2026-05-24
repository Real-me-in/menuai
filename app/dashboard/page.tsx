"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const publicMenuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${slug}`
      : "";

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("menus")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setRestaurantName(data.restaurant_name || "");
      setSlug(data.slug || "");
      setLogoUrl(data.logo_url || "");
    }
  }

  async function handleSave() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("menus")
      .update({
        restaurant_name: restaurantName,
        slug,
        logo_url: logoUrl,
      })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Saved successfully");
    }
  }

  async function handleLogoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-3xl font-bold">MenuAI Dashboard</h1>

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Restaurant Name
          </label>

          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full rounded border p-3"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Menu Slug
          </label>

          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border p-3"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block font-medium">
            Upload Restaurant Logo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
          />

          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="mt-4 h-24 w-24 rounded-full object-cover border"
            />
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded bg-black px-6 py-3 text-white"
        >
          {loading ? "Saving..." : "Save"}
        </button>

        {slug && (
          <div className="mt-10 text-center">
            <h2 className="mb-4 text-xl font-semibold">
              Public Menu QR Code
            </h2>

            <div className="inline-block bg-white p-4">
              <QRCode
                id="qr-code"
                value={publicMenuUrl}
                size={220}
              />
            </div>

            <p className="mt-4 text-sm text-gray-600">
              {publicMenuUrl}
            </p>

            <button
              onClick={downloadQR}
              className="mt-4 rounded bg-green-600 px-5 py-2 text-white"
            >
              Download QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}