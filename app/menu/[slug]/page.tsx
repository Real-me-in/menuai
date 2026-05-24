"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  ShoppingCart,
  Plus,
  Minus,
  MessageCircle,
  Send,
} from "lucide-react";

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

type CartItem = MenuItem & {
  quantity: number;
};

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params.slug as string;
  const isAdminPreview = searchParams.get("admin") === "true";

  const [menu, setMenu] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [askingAI, setAskingAI] = useState(false);

  useEffect(() => {
    if (slug) fetchRestaurantAndMenu();
  }, [slug]);

  async function fetchRestaurantAndMenu() {
    setLoading(true);

    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    const { data: menuData } = await supabase
      .from("menus")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    setRestaurant(restaurantData);
    setMenu(menuData);
    setLoading(false);
  }

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((x) => x.name === item.name);

      if (existing) {
        return current.map((x) =>
          x.name === item.name
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function decreaseQuantity(name: string) {
    setCart((current) =>
      current
        .map((x) =>
          x.name === name
            ? { ...x, quantity: x.quantity - 1 }
            : x
        )
        .filter((x) => x.quantity > 0)
    );
  }

  function getTotal() {
    return cart.reduce(
      (total, item) => total + Number(item.price || 0) * item.quantity,
      0
    );
  }

  async function placeOrder() {
    if (cart.length === 0) {
      alert("Please add at least one item to cart");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    setPlacingOrder(true);

    const { error } = await supabase.from("orders").insert({
      restaurant_slug: slug,
      customer_name: customerName,
      table_number: tableNumber,
      items: cart,
      total: getTotal(),
      status: "new",
    });

    setPlacingOrder(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order placed successfully!");

    setCart([]);
    setCustomerName("");
    setTableNumber("");
  }

  async function askAIWaiter() {
    if (!question.trim()) return;

    const userQuestion = question.trim();

    setChatMessages((current) => [
      ...current,
      { role: "user", text: userQuestion },
    ]);

    setQuestion("");
    setAskingAI(true);

    try {
      const response = await fetch("/api/ask-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          question: userQuestion,
        }),
      });

      const data = await response.json();

      setChatMessages((current) => [
        ...current,
        {
          role: "ai",
          text: data.answer || "Sorry, I could not answer that.",
        },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "Something went wrong. Please try again.",
        },
      ]);
    }

    setAskingAI(false);
  }

  if (loading) {
    return <div className="p-10 text-center text-xl">Loading menu...</div>;
  }

  if (!menu) {
    return <div className="p-10 text-center text-2xl">Menu not found</div>;
  }

  const sections = menu.menu_data?.sections || [];

  const restaurantName =
    restaurant?.name || menu.restaurant_name || "Restaurant";

  const logoUrl = restaurant?.logo_url || menu.logo_url;
  const bannerUrl = restaurant?.banner_url || menu.banner_url;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {isAdminPreview && (
        <div className="mx-auto mb-4 max-w-6xl">
          <Link
            href="/admin"
            className="inline-block rounded-xl bg-black px-4 py-2 font-semibold text-white shadow"
          >
            ← Back to Admin
          </Link>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt={restaurantName}
              className="h-56 w-full object-cover"
            />
          )}

          <div className="p-5">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Restaurant Logo"
                className="mx-auto -mt-16 mb-4 h-28 w-28 rounded-full border-4 border-white object-cover shadow"
              />
            )}

            <h1 className="mb-8 text-center text-4xl font-bold">
              {restaurantName}
            </h1>

            {sections.map((section: any, sectionIndex: number) => (
              <div key={sectionIndex} className="mb-10">
                <h2 className="mb-4 border-b pb-2 text-2xl font-semibold">
                  {section.name}
                </h2>

                <div className="space-y-5">
                  {section.items?.map((item: MenuItem, itemIndex: number) => (
                    <div
                      key={itemIndex}
                      className="overflow-hidden rounded-xl border bg-white shadow-sm"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-52 w-full object-cover"
                        />
                      )}

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-gray-600">
                              {item.description}
                            </p>
                          </div>

                          <div className="whitespace-nowrap text-lg font-bold">
                            ₹{item.price}
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(item)}
                          className="mt-4 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white"
                        >
                          <Plus size={18} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 rounded-2xl bg-green-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle className="text-green-700" />

                <h3 className="text-xl font-semibold text-green-700">
                  AI Waiter
                </h3>
              </div>

              <p className="mb-4 text-sm text-gray-700">
                Ask about dishes, ingredients, prices, or recommendations.
              </p>

              <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-white p-3">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Try asking: “What do you recommend?” or “Do you have spicy
                    items?”
                  </p>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`max-w-[85%] rounded-xl p-3 text-sm ${
                        message.role === "user"
                          ? "ml-auto bg-green-600 text-white"
                          : "mr-auto bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))
                )}

                {askingAI && (
                  <div className="mr-auto max-w-[85%] rounded-xl bg-gray-100 p-3 text-sm text-gray-500">
                    AI Waiter is typing...
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askAIWaiter();
                    }
                  }}
                  placeholder="Ask AI Waiter..."
                  className="flex-1 rounded-xl border p-3"
                />

                <button
                  onClick={askAIWaiter}
                  disabled={askingAI}
                  className="rounded-xl bg-green-600 px-4 text-white disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-5 shadow lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="text-green-700" />

            <h2 className="text-2xl font-bold">Your Order</h2>
          </div>

          {cart.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-gray-500">
              Your cart is empty.
            </p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.name} className="rounded-xl border p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>

                      <p className="text-sm text-gray-500">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>

                    <div className="font-bold">
                      ₹{Number(item.price || 0) * item.quantity}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => decreaseQuantity(item.name)}
                      className="rounded-full bg-gray-200 p-2"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="font-semibold">{item.quantity}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="rounded-full bg-green-600 p-2 text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 border-t pt-4">
            <div className="mb-4 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{getTotal()}</span>
            </div>

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="mb-3 w-full rounded-xl border p-3"
            />

            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table number"
              className="mb-4 w-full rounded-xl border p-3"
            />

            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white"
            >
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}