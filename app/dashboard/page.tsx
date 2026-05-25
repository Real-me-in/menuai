"use client";

import { hasAccess } from "@/lib/permissions";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";
import { useRestaurant } from "@/contexts/RestaurantContext";

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
  created_at?: string;
};

type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter";

export default function DashboardPage() {
  const { restaurant, restaurantSlug, loading: restaurantLoading } =
    useRestaurant();

  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (restaurantLoading) return;

    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !restaurant) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
         .from("restaurant_users")
         .select("role, restaurant_id")
         .eq("user_id", user.id)
         .maybeSingle();

      const userRole = roleData?.role as UserRole | undefined;

      if (
        !userRole ||
        !hasAccess(userRole, ["owner", "manager"])
      ) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setAuthorized(true);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_slug", restaurantSlug)
        .order("created_at", { ascending: false });

      setOrders((ordersData || []) as Order[]);
      setLoading(false);
    }

    loadDashboard();

    if (!restaurantSlug) return;

    const channel = supabase
      .channel(`dashboard-live-${restaurantSlug}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_slug=eq.${restaurantSlug}`,
        },
        async () => {
          const { data: ordersData } = await supabase
            .from("orders")
            .select("*")
            .eq("restaurant_slug", restaurantSlug)
            .order("created_at", { ascending: false });

          setOrders((ordersData || []) as Order[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant, restaurantSlug, restaurantLoading]);

  const analytics = useMemo(() => {
    const today = new Date().toDateString();

    const todayOrders = orders.filter(
      (order) =>
        order.created_at &&
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

  if (loading || restaurantLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading dashboard...
        </main>
      </ProtectedPage>
    );
  }

  if (!authorized) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div>
            <h1 className="text-3xl font-bold text-red-400">
              Access denied
            </h1>

            <p className="mt-3 text-zinc-300">
              You do not have permission to view this dashboard.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-bold text-black"
            >
              Go Home
            </Link>
          </div>
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

                <p className="mt-2 text-sm text-zinc-500">
                  Role: {role}
                </p>
              </div>
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