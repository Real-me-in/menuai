"use client";

import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";
import { useEffect, useRef, useState } from "react";
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
  status: string | null;
  created_at: string;
};

type FilterType = "all" | "new" | "preparing" | "ready";

export default function KitchenPage() {
  const restaurantSlug = "mango-groove";

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastOrderIds, setLastOrderIds] = useState<string[]>([]);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<string[]>([]);
  const [now, setNow] = useState(new Date());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_slug", restaurantSlug)
      .not("status", "eq", "completed")
      .order("created_at", { ascending: true });

    if (error) {
      alert("Error loading kitchen orders: " + error.message);
      return;
    }

    const fetchedOrders = (data || []) as Order[];
    const currentIds = fetchedOrders.map((order) => order.id);

    if (lastOrderIds.length > 0) {
      const newIds = currentIds.filter((id) => !lastOrderIds.includes(id));

      if (newIds.length > 0) {
        setNewlyArrivedIds((prev) => [...prev, ...newIds]);

        if (soundEnabled && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        setTimeout(() => {
          setNewlyArrivedIds((prev) =>
            prev.filter((id) => !newIds.includes(id))
          );
        }, 15000);
      }
    }

    setLastOrderIds(currentIds);
    setOrders(fetchedOrders);
  };

  useEffect(() => {
    audioRef.current = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );

    fetchOrders();

    const channel = supabase
      .channel("advanced-kitchen-live-orders-mango-groove")
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

    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [soundEnabled, lastOrderIds]);

  const updateStatus = async (orderId: string, status: string) => {
    setLoadingId(orderId);

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select();

    setLoadingId(null);

    if (error) {
      alert("Status update failed: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("No order was updated. Check Supabase update permissions.");
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    fetchOrders();
  };

  const getMinutesWaiting = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const current = now.getTime();

    return Math.max(0, Math.floor((current - created) / 60000));
  };

  const getStatusStyle = (status: string | null) => {
    if (status === "ready") return "bg-green-600 text-white";
    if (status === "preparing") return "bg-yellow-400 text-black";
    return "bg-red-600 text-white";
  };

  const filteredOrders = orders.filter((order) => {
    const status = order.status || "new";

    if (filter === "all") return true;
    if (filter === "new") return status === "new" || status === "";

    return status === filter;
  });

  const countByStatus = (status: string) => {
    return orders.filter((order) => (order.status || "new") === status).length;
  };

  return (
    <ProtectedPage>
      <AppNav />

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl p-6">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-zinc-950/90 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-4xl font-bold">Restaurant Kitchen</h1>

              <p className="mt-1 text-zinc-300">
                Live kitchen workflow with sound alerts and order timers
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);

                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                  }
                }}
                className={`rounded-xl px-5 py-3 font-bold ${
                  soundEnabled
                    ? "bg-green-600 text-white ring-2 ring-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {soundEnabled ? "🔔 Buzzer On" : "🔕 Enable Buzzer"}
              </button>

              <button
                onClick={fetchOrders}
                className="rounded-xl bg-yellow-500 px-5 py-3 font-bold text-black"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl p-4 text-left ${
                filter === "all" ? "bg-white text-black" : "bg-zinc-900"
              }`}
            >
              <div className="text-sm text-zinc-500">All Active</div>
              <div className="text-3xl font-bold">{orders.length}</div>
            </button>

            <button
              onClick={() => setFilter("new")}
              className={`rounded-xl p-4 text-left ${
                filter === "new" ? "bg-red-600 text-white" : "bg-zinc-900"
              }`}
            >
              <div className="text-sm opacity-80">New</div>
              <div className="text-3xl font-bold">{countByStatus("new")}</div>
            </button>

            <button
              onClick={() => setFilter("preparing")}
              className={`rounded-xl p-4 text-left ${
                filter === "preparing"
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900"
              }`}
            >
              <div className="text-sm opacity-80">Preparing</div>
              <div className="text-3xl font-bold">
                {countByStatus("preparing")}
              </div>
            </button>

            <button
              onClick={() => setFilter("ready")}
              className={`rounded-xl p-4 text-left ${
                filter === "ready" ? "bg-green-600 text-white" : "bg-zinc-900"
              }`}
            >
              <div className="text-sm opacity-80">Ready</div>
              <div className="text-3xl font-bold">{countByStatus("ready")}</div>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 p-10 text-center text-2xl">
              No orders in this view
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => {
                const waitingMinutes = getMinutesWaiting(order.created_at);
                const isOverdue = waitingMinutes >= 20;
                const isNewArrival = newlyArrivedIds.includes(order.id);
                const status = order.status || "new";

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl p-6 shadow-lg transition ${
                      isNewArrival
                        ? "animate-pulse border-4 border-red-500 bg-red-950"
                        : isOverdue
                        ? "border-4 border-orange-500 bg-zinc-900"
                        : "bg-zinc-900"
                    }`}
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-bold">
                          Table {order.table_number || "N/A"}
                        </h2>

                        {order.customer_name && (
                          <p className="mt-1 text-zinc-400">
                            Customer: {order.customer_name}
                          </p>
                        )}

                        <p className="mt-2 text-sm text-zinc-500">
                          Order Time:{" "}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`rounded-full px-4 py-2 text-sm font-bold uppercase ${getStatusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </div>

                        {isNewArrival && (
                          <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold">
                            NEW ORDER
                          </div>
                        )}

                        {isOverdue && (
                          <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-black">
                            OVERDUE
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-5 rounded-xl bg-zinc-950 p-4">
                      <div
                        className={`text-2xl font-bold ${
                          isOverdue ? "text-orange-400" : "text-white"
                        }`}
                      >
                        Waiting: {waitingMinutes} min
                      </div>
                    </div>

                    <div className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between rounded-lg bg-zinc-800 p-4 text-xl"
                        >
                          <span>{item.name}</span>
                          <span className="font-bold">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        disabled={loadingId === order.id}
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="rounded-xl bg-yellow-400 px-4 py-4 text-lg font-bold text-black disabled:opacity-50"
                      >
                        {loadingId === order.id ? "Updating..." : "Preparing"}
                      </button>

                      <button
                        disabled={loadingId === order.id}
                        onClick={() => updateStatus(order.id, "ready")}
                        className="rounded-xl bg-green-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
                      >
                        {loadingId === order.id ? "Updating..." : "Ready"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </ProtectedPage>
  );
}