"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ShoppingCart, Plus, Minus } from "lucide-react";

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

export default function MenuPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [menu, setMenu] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (slug) fetchMenu();
  }, [slug]);

  async function fetchMenu() {
    const { data } = await supabase
      .from("menus")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    setMenu(data);
    setLoading(false);
  }

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((x) => x.name === item.name);

      if (existing) {
        return current.map((x) =>
          x.name === item.name ? { ...x, quantity: x.quantity + 1 } : x
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }

  function decreaseQuantity(name: string) {
    setCart((current) =>
      current
        .map((x) =>
          x.name === name ? { ...x, quantity: x.quantity - 1 } : x
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

  if (loading) {
    return <div className="p-10 text-center text-xl">Loading menu...</div>;
  }

  if (!menu) {
    return <div className="p-10 text-center text-2xl">Menu not found</div>;
  }

  const sections = menu.menu_data?.sections || [];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl bg-white p-5 shadow">
          {menu.logo_url && (
            <img
              src={menu.logo_url}
              alt="Restaurant Logo"
              className="mx-auto mb-4 h-28 w-28 rounded-full border object-cover shadow"
            />
          )}

          <h1 className="mb-8 text-center text-4xl font-bold">
            {menu.restaurant_name}
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
                          <h3 className="text-lg font-semibold">{item.name}</h3>
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

          <div className="mt-8 rounded-2xl bg-green-50 p-5 text-center">
            <h3 className="text-lg font-semibold text-green-700">AI Waiter</h3>
            <p className="mt-2 text-sm text-gray-700">
              Ask our AI waiter about dishes, ingredients and recommendations.
            </p>
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