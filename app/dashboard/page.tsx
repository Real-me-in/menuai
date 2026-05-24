"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  name: string;
  quantity: number;
  price?: number;
};

type Order = {
  id: string;
  table_number?: string;
  customer_name?: string;
  items: OrderItem[];
  status?: string;
  payment_status?: string;
  grand_total?: number;
  created_at: string;
};

type Restaurant = {
  name?: string;
  logo_url?: string;
  banner_url?: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const restaurantSlug = "mango-groove";

  const fetchRestaurant = async () => {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", restaurantSlug)
      .maybeSingle();

    setRestaurant(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_slug", restaurantSlug)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();
    fetchOrders();

    const channel = supabase
      .channel("dashboard-live-mango-groove")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "restaurant_slug=eq.mango-groove",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const analytics = useMemo(() => {
    const today = new Date().toDateString();

    const todayOrders = orders.filter(
      (order) =>
        new Date(order.created_at).toDateString() === today
    );

    const revenue = todayOrders.reduce((sum, order) => {
      return sum + Number(order.grand_total || 0);
    }, 0);

    const paidOrders = todayOrders.filter(
      (order) => order.payment_status === "paid"
    ).length;

    const pendingOrders = todayOrders.filter(
      (order) => order.payment_status !== "paid"
    ).length;

    const averageOrder =
      todayOrders.length > 0
        ? revenue / todayOrders.length
        : 0;

    const itemMap: Record<string, number> = {};

    todayOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = 0;
        }

        itemMap[item.name] += Number(item.quantity || 0);
      });
    });

    const topItems = Object.entries(itemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      todayOrders,
      revenue,
      paidOrders,
      pendingOrders,
      averageOrder,
      topItems,
    };
  }, [orders]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {restaurant?.banner_url && (
        <div className="relative h-64 w-full overflow-hidden">
          <img
            src={restaurant.banner_url}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl p-6">
        <div className="-mt-24 mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            {restaurant?.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-2xl"
              />
            )}

            <div>
              <h1 className="text-4xl font-bold">
                {restaurant?.name || "Restaurant"} Dashboard
              </h1>

              <p className="mt-2 text-zinc-300">
                Real-time restaurant intelligence and operations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold"
            >
              Orders
            </Link>

            <Link
              href="/kitchen"
              className="rounded-xl bg-green-600 px-5 py-3 font-bold"
            >
              Kitchen
            </Link>

            <Link
              href={`/menu/${restaurantSlug}`}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-bold text-black"
            >
              Live Menu
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="text-zinc-400">Today Revenue</div>

            <div className="mt-3 text-4xl font-bold text-green-400">
              ₹{analytics.revenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="text-zinc-400">Today's Orders</div>

            <div className="mt-3 text-4xl font-bold">
              {analytics.todayOrders.length}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="text-zinc-400">
              Average Order Value
            </div>

            <div className="mt-3 text-4xl font-bold text-blue-400">
              ₹{analytics.averageOrder.toFixed(0)}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="text-zinc-400">Paid Orders</div>

            <div className="mt-3 text-4xl font-bold text-yellow-400">
              {analytics.paidOrders}
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Best Selling Items
              </h2>

              <div className="rounded-full bg-zinc-800 px-4 py-2 text-sm">
                Today
              </div>
            </div>

            {analytics.topItems.length === 0 ? (
              <div className="text-zinc-500">
                No sales data yet
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.topItems.map(([name, qty], index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl bg-zinc-800 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 font-bold">
                        {index + 1}
                      </div>

                      <div>
                        <div className="font-bold">{name}</div>

                        <div className="text-sm text-zinc-400">
                          Top ordered item
                        </div>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-green-400">
                      {qty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Order Status Overview
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between">
                  <span>Paid Orders</span>
                  <span>{analytics.paidOrders}</span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${
                        analytics.todayOrders.length
                          ? (analytics.paidOrders /
                              analytics.todayOrders.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <span>Pending Orders</span>
                  <span>{analytics.pendingOrders}</span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${
                        analytics.todayOrders.length
                          ? (analytics.pendingOrders /
                              analytics.todayOrders.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-black p-6">
              <div className="text-zinc-400">
                Restaurant Health
              </div>

              <div className="mt-3 text-5xl font-bold text-green-400">
                Excellent
              </div>

              <div className="mt-2 text-zinc-500">
                Orders are flowing smoothly today
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Recent Orders
            </h2>

            <div className="rounded-full bg-zinc-800 px-4 py-2 text-sm">
              Live Feed
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-zinc-500">
              No orders available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-zinc-400">
                    <th className="pb-4">Table</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Payment</th>
                    <th className="pb-4">Total</th>
                    <th className="pb-4">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800"
                    >
                      <td className="py-4 font-bold">
                        {order.table_number || "N/A"}
                      </td>

                      <td className="py-4">
                        {order.customer_name || "-"}
                      </td>

                      <td className="py-4">
                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm">
                          {order.status || "new"}
                        </span>
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            order.payment_status === "paid"
                              ? "bg-green-600"
                              : "bg-red-600"
                          }`}
                        >
                          {order.payment_status || "pending"}
                        </span>
                      </td>

                      <td className="py-4 font-bold text-green-400">
                        ₹
                        {Number(order.grand_total || 0).toFixed(2)}
                      </td>

                      <td className="py-4 text-zinc-400">
                        {new Date(
                          order.created_at
                        ).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}