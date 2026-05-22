"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState("");

  const [restaurantName, setRestaurantName] = useState("Green Leaf Cafe");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#16a34a");

  const [menuText, setMenuText] = useState(`Starters:
Paneer Tikka - ₹220 - spicy grilled paneer
Tomato Soup - ₹120 - vegetarian creamy soup
Crispy Corn - ₹180 - mildly spicy crispy corn

Main Course:
Veg Biryani - ₹250 - medium spicy rice dish
Butter Naan - ₹60
Dal Tadka - ₹180 - vegetarian lentil curry
Paneer Butter Masala - ₹260 - creamy paneer curry

Desserts:
Gulab Jamun - ₹90
Chocolate Brownie - ₹140

Drinks:
Mango Lassi - ₹120
Fresh Lime Soda - ₹80`);

  const [menuData, setMenuData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [myMenus, setMyMenus] = useState<any[]>([]);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      setUserId(data.session.user.id);
      loadMyMenus(data.session.user.id);
      setCheckingAuth(false);
    }

    checkUser();
  }, []);

  async function uploadImage(file: File, type: "logo" | "banner") {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${type}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("menuai-images")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("menuai-images")
      .getPublicUrl(fileName);

    if (type === "logo") {
      setLogoUrl(data.publicUrl);
    } else {
      setBannerUrl(data.publicUrl);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function loadMyMenus(ownerId: string) {
    const response = await fetch("/api/my-menus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: ownerId }),
    });

    const data = await response.json();

    if (data.menus) {
      setMyMenus(data.menus);
    }
  }

  async function deleteMenu(menuId: string) {
    const confirmDelete = confirm("Are you sure you want to delete this menu?");
    if (!confirmDelete) return;

    const response = await fetch("/api/delete-menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ menuId, userId }),
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Menu deleted successfully.");
    loadMyMenus(userId);
  }

  async function copyMenuLink(menuSlug: string) {
    const link = `${window.location.origin}/menu/${menuSlug}`;
    await navigator.clipboard.writeText(link);
    alert("Menu link copied.");
  }

  function editMenu(menu: any) {
    setRestaurantName(menu.restaurant_name);
    setMenuData(menu.menu_data);
    setSlug(menu.slug);
    setLogoUrl(menu.logo_url || "");
    setBannerUrl(menu.banner_url || "");
    setThemeColor(menu.theme_color || "#16a34a");
    setQuestion("");
    setAnswer("");

    const readableMenu = menu.menu_data.sections
      .map((section: any) => {
        const items = section.items
          .map((item: any) => `${item.name} - ${item.price} - ${item.description}`)
          .join("\n");

        return `${section.name}:\n${items}`;
      })
      .join("\n\n");

    setMenuText(readableMenu);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generateMenu() {
    try {
      setLoading(true);

      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantName,
          menuText,
          userId,
          logoUrl,
          bannerUrl,
          themeColor,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      setSlug(data.slug);
      setMenuData(JSON.parse(data.result));
      loadMyMenus(userId);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  async function askMenuAI() {
    const response = await fetch("/api/ask-menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ menuData, question }),
    });

    const data = await response.json();
    setAnswer(data.answer);
  }

  const publicMenuUrl = slug ? `${window.location.origin}/menu/${slug}` : "";

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <p className="text-xl font-semibold text-green-800">Checking login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-6xl font-bold text-green-800">
              Restaurant Dashboard
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              AI-powered restaurant management platform
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-500 px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <label className="text-xl font-semibold">Restaurant Name</label>

          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-gray-300 p-4 text-xl"
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-xl font-semibold">Upload Logo</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, "logo");
                }}
                className="mt-3 w-full rounded-2xl border border-gray-300 p-4"
              />

              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="mt-4 h-24 w-24 rounded-full object-cover"
                />
              )}
            </div>

            <div>
              <label className="text-xl font-semibold">Upload Banner</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, "banner");
                }}
                className="mt-3 w-full rounded-2xl border border-gray-300 p-4"
              />

              {bannerUrl && (
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="mt-4 h-28 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </div>

          <div className="mt-8">
            <label className="text-xl font-semibold">Theme Color</label>

            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="mt-3 h-14 w-28 cursor-pointer rounded-xl border"
            />
          </div>

          <div className="mt-8">
            <label className="text-xl font-semibold">Paste Menu Text</label>

            <textarea
              rows={14}
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-gray-300 p-4 text-lg"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={generateMenu}
              disabled={loading}
              style={{ backgroundColor: themeColor }}
              className="rounded-2xl px-8 py-4 text-xl font-semibold text-white disabled:bg-gray-400"
            >
              {loading ? "Generating..." : "Generate / Save Menu"}
            </button>

            {slug && (
              <a
                href={`/menu/${slug}`}
                target="_blank"
                className="rounded-2xl border px-8 py-4 text-xl font-semibold"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                View Public Menu
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-bold" style={{ color: themeColor }}>
            My Menus
          </h2>

          {myMenus.length === 0 ? (
            <p className="mt-4 text-gray-500">No menus created yet.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {myMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="rounded-2xl border border-green-100 bg-green-50 p-6"
                >
                  <h3 className="text-2xl font-bold">{menu.restaurant_name}</h3>
                  <p className="mt-2 text-gray-600">/menu/{menu.slug}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => editMenu(menu)}
                      className="rounded-xl border border-blue-500 px-5 py-2 font-semibold text-blue-600"
                    >
                      Edit Menu
                    </button>

                    <a
                      href={`/menu/${menu.slug}`}
                      target="_blank"
                      className="rounded-xl px-5 py-2 font-semibold text-white"
                      style={{ backgroundColor: menu.theme_color || themeColor }}
                    >
                      Open Menu
                    </a>

                    <button
                      onClick={() => copyMenuLink(menu.slug)}
                      className="rounded-xl border px-5 py-2 font-semibold"
                      style={{
                        borderColor: menu.theme_color || themeColor,
                        color: menu.theme_color || themeColor,
                      }}
                    >
                      Copy Link
                    </button>

                    <button
                      onClick={() => deleteMenu(menu.id)}
                      className="rounded-xl border border-red-500 px-5 py-2 font-semibold text-red-600"
                    >
                      Delete Menu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {menuData && (
          <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-xl">
            {bannerUrl && (
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${bannerUrl})` }}
              />
            )}

            <div className="p-8">
              {logoUrl && (
                <div className="-mt-20 mb-6 flex justify-center">
                  <img
                    src={logoUrl}
                    alt="Restaurant logo"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                </div>
              )}

              <h2
                className="text-center text-5xl font-bold"
                style={{ color: themeColor }}
              >
                {menuData.restaurantName}
              </h2>

              <p className="mt-3 text-center text-lg text-gray-500">
                AI-powered digital menu
              </p>

              {slug && (
                <div className="mt-10 rounded-3xl bg-green-50 p-10 text-center">
                  <h2 className="text-4xl font-bold" style={{ color: themeColor }}>
                    QR Code
                  </h2>

                  <p className="mt-3 text-lg text-gray-600">
                    Customers can scan this QR code to open the menu.
                  </p>

                  <div className="mt-8 flex justify-center">
                    <div className="rounded-3xl bg-white p-6 shadow-lg">
                      <QRCodeCanvas value={publicMenuUrl} size={240} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-14 space-y-14">
                {menuData.sections.map((section: any, index: number) => (
                  <section key={index}>
                    <h2 className="mb-6 border-b pb-3 text-4xl font-bold">
                      {section.name}
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                      {section.items.map((item: any, itemIndex: number) => (
                        <div
                          key={itemIndex}
                          className="rounded-3xl border border-green-100 bg-green-50 p-7"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-3xl font-bold">{item.name}</h3>
                              <p className="mt-3 text-lg text-gray-600">
                                {item.description}
                              </p>
                            </div>

                            <span
                              className="text-3xl font-bold"
                              style={{ color: themeColor }}
                            >
                              {item.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-16 rounded-3xl bg-green-50 p-10">
                <h2 className="text-5xl font-bold" style={{ color: themeColor }}>
                  Ask MenuAI
                </h2>

                <div className="mt-8 flex gap-4">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="suggest spicy dishes"
                    className="flex-1 rounded-2xl border border-gray-300 p-4 text-xl"
                  />

                  <button
                    onClick={askMenuAI}
                    style={{ backgroundColor: themeColor }}
                    className="rounded-2xl px-8 py-4 text-xl font-semibold text-white"
                  >
                    Ask AI
                  </button>
                </div>

                {answer && (
                  <div className="mt-8 rounded-2xl bg-white p-6 text-xl leading-relaxed shadow">
                    {answer}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}