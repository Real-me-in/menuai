"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderStatus = "new" | "preparing" | "ready" | "served" | "completed";

type Order = {
  id: string;
  restaurant_id: string;
  table_number: string | null;
  customer_name: string | null;
  items: any;
  total_amount: number | null;
  status: OrderStatus;
  created_at: string;
};

const allowedRoles = ["owner", "manager", "waiter"];

export default function WaiterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    initializeWaiter();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`waiter-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;

            setOrders((prev) => {
              if (!["ready", "served"].includes(newOrder.status)) return prev;
              return [newOrder, ...prev];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;

            setOrders((prev) => {
              const exists = prev.some((order) => order.id === updatedOrder.id);

              if (!["ready", "served"].includes(updatedOrder.status)) {
                return prev.filter((order) => order.id !== updatedOrder.id);
              }

              if (exists) {
                return prev.map((order) =>
                  order.id === updatedOrder.id ? updatedOrder : order
                );
              }

              return [updatedOrder, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            const deletedOrder = payload.old as Order;

            setOrders((prev) =>
              prev.filter((order) => order.id !== deletedOrder.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function getAuthToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  }

  async function initializeWaiter() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please login.");
        setAllowed(false);
        return;
      }

      const { data: restaurantUser, error: roleError } = await supabase
        .from("restaurant_users")
        .select("restaurant_id, role")
        .eq("user_id", user.id)
        .single();

      if (roleError || !restaurantUser) {
        setError("Restaurant access not found.");
        setAllowed(false);
        return;
      }

      if (!allowedRoles.includes(restaurantUser.role)) {
        setError("Access denied.");
        setAllowed(false);
        return;
      }

      setAllowed(true);
      setRestaurantId(restaurantUser.restaurant_id);

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantUser.restaurant_id)
        .in("status", ["ready", "served"])
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders((data || []) as Order[]);
    } catch (err: any) {
      setError(err.message || "Failed to load waiter dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function updateServiceStatus(orderId: string, status: "served" | "completed") {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const token = await getAuthToken();

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const response = await fetch("/api/update-order-service-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update order status.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function formatItems(items: any) {
    if (!Array.isArray(items)) return "No items";

    return items
      .map((item) => {
        const qty = item.quantity || item.qty || 1;
        const name = item.name || item.item_name || "Item";
        return `${qty} × ${name}`;
      })
      .join(", ");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        Loading waiter dashboard...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-2xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Waiter Dashboard
            </h1>
            <p className="text-gray-600">
              Serve ready orders and complete delivered orders.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-black px-4 py-2 text-center text-white"
          >
            Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <p className="text-gray-600">No ready orders right now.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl bg-white p-5 shadow">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Table {order.table_number || "N/A"}
                    </h2>

                    {order.customer_name && (
                      <p className="text-sm text-gray-600">
                        Customer: {order.customer_name}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    {order.status}
                  </span>
                </div>

                <p className="mb-3 text-gray-700">{formatItems(order.items)}</p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>

                  {order.status === "ready" && (
                    <button
                      onClick={() => updateServiceStatus(order.id, "served")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {updatingOrderId === order.id
                        ? "Updating..."
                        : "Mark as served"}
                    </button>
                  )}

                  {order.status === "served" && (
                    <button
                      onClick={() => updateServiceStatus(order.id, "completed")}
                      disabled={updatingOrderId === order.id}
                      className="rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {updatingOrderId === order.id
                        ? "Updating..."
                        : "Complete order"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}