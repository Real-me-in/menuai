"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  name: string;
  price: string;
  description: string;
  tags?: string[];
};

type MenuSection = {
  name: string;
  items: MenuItem[];
};

type MenuData = {
  restaurantName: string;
  sections: MenuSection[];
};

export default function DashboardPage() {
  const [restaurantName, setRestaurantName] = useState("");
  const [menuText, setMenuText] = useState("");
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [rawResult, setRawResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuSlug, setMenuSlug] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#16a34a");

  async function generateMenu() {
    try {
      setLoading(true);
      setMenuData(null);
      setRawResult("");
      setMenuSlug("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first.");
        return;
      }

      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          menuText,
          userId: user.id,
          logoUrl,
          bannerUrl,
          themeColor,
        }),
      });

      const data = await response.json();

      let resultText = data.result || "";

      resultText = resultText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const start = resultText.indexOf("{");
      const end = resultText.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        resultText = resultText.substring(start, end + 1);
      }

      const parsed = JSON.parse(resultText);

      setMenuData(parsed);
      setMenuSlug(data.slug);
    } catch (error) {
      setRawResult(
        "Could not convert JSON into menu cards. Try clicking Generate again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-900">
          Restaurant Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Paste your menu text and generate an AI-powered digital menu.
        </p>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-lg">
          <div className="space-y-5">
            <input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Restaurant Name"
              className="w-full rounded-xl border border-gray-300 p-3"
            />

            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Restaurant Logo Image URL"
              className="w-full rounded-xl border border-gray-300 p-3"
            />

            <input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Restaurant Banner Image URL"
              className="w-full rounded-xl border border-gray-300 p-3"
            />

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Theme Color
              </label>

              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-14 w-28 cursor-pointer rounded-xl border border-gray-300"
              />
            </div>

            <textarea
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder="Paste your restaurant menu here..."
              className="h-72 w-full rounded-xl border border-gray-300 p-3"
            />

            <button
              type="button"
              onClick={generateMenu}
              disabled={loading}
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Generating..." : "Generate AI Menu"}
            </button>
          </div>
        </div>

        {menuData && (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
            <h2
              className="text-center text-4xl font-bold"
              style={{ color: themeColor }}
            >
              {menuData.restaurantName}
            </h2>

            <p className="mt-2 text-center text-gray-500">
              AI-powered digital menu
            </p>

            <div className="mt-10 space-y-10">
              {menuData.sections.map((section, index) => (
                <section key={index}>
                  <h3
                    className="mb-4 border-b pb-2 text-2xl font-bold"
                    style={{ color: themeColor }}
                  >
                    {section.name}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="rounded-2xl border border-green-100 bg-green-50 p-5"
                      >
                        <div className="flex justify-between gap-4">
                          <h4 className="text-lg font-bold">{item.name}</h4>

                          <span
                            className="font-bold"
                            style={{ color: themeColor }}
                          >
                            {item.price}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          {item.description}
                        </p>

                        {item.tags && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="rounded-full bg-white px-3 py-1 text-xs font-medium"
                                style={{ color: themeColor }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {menuSlug && (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900">
              Public Menu Link
            </h3>

            <a
              href={`/menu/${menuSlug}`}
              target="_blank"
              className="mt-3 block text-green-700 underline"
            >
              {window.location.origin}/menu/{menuSlug}
            </a>

            <div className="mt-6 flex justify-center">
              <div className="rounded-2xl bg-white p-4">
                <QRCode
                  value={`${window.location.origin}/menu/${menuSlug}`}
                  size={180}
                />
              </div>
            </div>
          </div>
        )}

        {rawResult && (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
            {rawResult}
          </div>
        )}
      </div>
    </main>
  );
}