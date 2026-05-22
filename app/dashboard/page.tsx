"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function DashboardPage() {
  const [restaurantName, setRestaurantName] =
    useState("Green Leaf Cafe");

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
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      setSlug(data.slug);

      const parsed = JSON.parse(data.result);

      setMenuData(parsed);

      setLoading(false);
    } catch (error) {
      console.error(error);

      alert("Something went wrong.");

      setLoading(false);
    }
  }

  async function askMenuAI() {
    try {
      const response = await fetch("/api/ask-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuData,
          question,
        }),
      });

      const data = await response.json();

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
    }
  }

  const publicMenuUrl =
    slug
      ? `https://menuai-tau.vercel.app/menu/${slug}`
      : "";

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-6xl font-bold text-green-800">
          Restaurant Dashboard
        </h1>

        <p className="mt-4 text-xl text-gray-600">
          Paste your menu text and generate an AI-powered digital menu.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
          <div>
            <label className="text-xl font-semibold">
              Restaurant Name
            </label>

            <input
              type="text"
              value={restaurantName}
              onChange={(e) =>
                setRestaurantName(e.target.value)
              }
              className="mt-3 w-full rounded-2xl border border-gray-300 p-4 text-xl"
            />
          </div>

          <div className="mt-8">
            <label className="text-xl font-semibold">
              Paste Menu Text
            </label>

            <textarea
              rows={14}
              value={menuText}
              onChange={(e) =>
                setMenuText(e.target.value)
              }
              className="mt-3 w-full rounded-2xl border border-gray-300 p-4 text-lg"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={generateMenu}
              className="rounded-2xl bg-green-600 px-8 py-4 text-xl font-semibold text-white hover:bg-green-700"
            >
              {loading
                ? "Generating..."
                : "Generate AI Menu"}
            </button>

            {slug && (
              <a
                href={`/menu/${slug}`}
                target="_blank"
                className="rounded-2xl border border-green-600 px-8 py-4 text-xl font-semibold text-green-700 hover:bg-green-50"
              >
                View Public Menu
              </a>
            )}
          </div>
        </div>

        {menuData && (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-center text-5xl font-bold text-green-800">
              {menuData.restaurantName}
            </h2>

            <p className="mt-3 text-center text-lg text-gray-500">
              AI-powered digital menu
            </p>

            {slug && (
              <div className="mt-10 rounded-3xl bg-green-50 p-10 text-center">
                <h2 className="text-4xl font-bold text-green-800">
                  QR Code
                </h2>

                <p className="mt-3 text-lg text-gray-600">
                  Customers can scan this QR code to open the menu.
                </p>

                <div className="mt-8 flex justify-center">
                  <div className="rounded-3xl bg-white p-6 shadow-lg">
                    <QRCodeCanvas
                      value={publicMenuUrl}
                      size={240}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <a
                    href={publicMenuUrl}
                    target="_blank"
                    className="rounded-2xl bg-green-600 px-8 py-4 text-xl font-semibold text-white hover:bg-green-700"
                  >
                    Open Public Menu
                  </a>
                </div>
              </div>
            )}

            <div className="mt-14 space-y-14">
              {menuData.sections.map(
                (section: any, index: number) => (
                  <section key={index}>
                    <h2 className="mb-6 border-b pb-3 text-4xl font-bold">
                      {section.name}
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                      {section.items.map(
                        (
                          item: any,
                          itemIndex: number
                        ) => (
                          <div
                            key={itemIndex}
                            className="rounded-3xl border border-green-100 bg-green-50 p-7"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-3xl font-bold">
                                  {item.name}
                                </h3>

                                <p className="mt-3 text-lg text-gray-600">
                                  {item.description}
                                </p>

                                {item.tags && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {item.tags.map(
                                      (
                                        tag: string,
                                        tagIndex: number
                                      ) => (
                                        <span
                                          key={tagIndex}
                                          className="rounded-full bg-white px-4 py-1 text-sm text-green-700"
                                        >
                                          {tag}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>

                              <span className="text-3xl font-bold text-green-700">
                                {item.price}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>

            <div className="mt-16 rounded-3xl bg-green-50 p-10">
              <h2 className="text-5xl font-bold text-green-800">
                Ask MenuAI
              </h2>

              <p className="mt-3 text-lg text-gray-600">
                Ask questions about the menu.
              </p>

              <div className="mt-8 flex gap-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) =>
                    setQuestion(e.target.value)
                  }
                  placeholder="suggest spicy dishes"
                  className="flex-1 rounded-2xl border border-gray-300 p-4 text-xl"
                />

                <button
                  onClick={askMenuAI}
                  className="rounded-2xl bg-green-600 px-8 py-4 text-xl font-semibold text-white hover:bg-green-700"
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
        )}
      </div>
    </main>
  );
}