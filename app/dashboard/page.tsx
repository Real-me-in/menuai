"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";

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
      (order) => new Date(order.created_at).toDateString() === today
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
      todayOrders.length > 0 ? revenue / todayOrders.length : 0;

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
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading dashboard...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppNav />

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
                href={`/menu/${restaurantSlug}?admin=true`}
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
              <div className="text-zinc-400">Average Order Value</div>
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
        </div>
      </main>
    </ProtectedPage>
  );
}