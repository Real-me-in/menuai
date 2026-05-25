"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";
import { useRestaurant } from "@/contexts/RestaurantContext";

type UserRole = "owner" | "manager" | "cashier" | "kitchen" | "waiter";

type OrderItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  restaurant_id: string;
  table_number?: string;
  customer_name?: string;
  items: OrderItem[];
  status: string;
  subtotal?: number;
  tax_amount?: number;
  service_charge?: number;
  grand_total?: number;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
};

export default function OrdersDashboardPage() {
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [taxPercent, setTaxPercent] = useState(5);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  async function getAuthToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  }

  async function fetchOrders(currentRestaurantId?: string) {
    try {
      const targetRestaurantId = currentRestaurantId || restaurantId;

      if (!targetRestaurantId) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", targetRestaurantId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message || "Failed to load orders");
        return;
      }

      setOrders((data || []) as Order[]);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    }
  }

  useEffect(() => {
    if (restaurantLoading) return;

    async function checkAccessAndLoad() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("restaurant_users")
        .select("restaurant_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userRole = roleData?.role as UserRole | undefined;

      if (
        roleError ||
        !roleData ||
        !userRole ||
        !["owner", "manager", "waiter", "cashier"].includes(userRole)
      ) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setAuthorized(true);
      setRestaurantId(roleData.restaurant_id);

      await fetchOrders(roleData.restaurant_id);

      setLoading(false);
    }

    checkAccessAndLoad();
  }, [restaurantLoading]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders-dashboard-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchOrders(restaurantId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const bill = useMemo(() => {
    if (!selectedOrder) {
      return {
        subtotal: 0,
        taxAmount: 0,
        service: 0,
        grandTotal: 0,
      };
    }

    const subtotal = selectedOrder.items.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);

    const taxAmount = (subtotal * Number(taxPercent || 0)) / 100;
    const service = Number(serviceCharge || 0);
    const grandTotal = subtotal + taxAmount + service;

    return {
      subtotal,
      taxAmount,
      service,
      grandTotal,
    };
  }, [selectedOrder, taxPercent, serviceCharge]);

  async function updateOrderStatus(orderId: string, status: string) {
    const token = await getAuthToken();

    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    const response = await fetch("/api/update-order-status", {
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
      alert(result.error || "Failed to update order.");
      return;
    }

    await fetchOrders();
  }

  async function saveBill() {
    if (!selectedOrder || !restaurantId) return;

    const { error } = await supabase
      .from("orders")
      .update({
        subtotal: bill.subtotal,
        tax_amount: bill.taxAmount,
        service_charge: bill.service,
        grand_total: bill.grandTotal,
        payment_method: paymentMethod,
        payment_status: "paid",
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", selectedOrder.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      alert("Error saving bill: " + error.message);
      return;
    }

    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== selectedOrder.id)
    );

    setSelectedOrder(null);
    alert("Bill saved successfully");
  }

  function printReceipt() {
    window.print();
  }

  if (loading || restaurantLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading orders...
        </main>
      </ProtectedPage>
    );
  }

  if (!authorized) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div>
            <h1 className="text-4xl font-bold text-red-500">Access denied</h1>
            <p className="mt-4 text-zinc-300">
              Only owners, managers, waiters, or cashiers can access orders.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-bold text-black"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppNav />

      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mb-6 flex items-center gap-4">
          {restaurant?.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-16 w-16 rounded-full object-cover shadow"
            />
          )}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {restaurant?.name || "Restaurant"} Orders
            </h1>

            <p className="text-gray-600">Live billing and payment management</p>

            <p className="mt-1 text-sm text-gray-500">Logged in as: {role}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 print:hidden">
            {orders.length === 0 ? (
              <div className="rounded-xl bg-white p-6 shadow">
                No live orders right now.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-xl bg-white p-5 shadow">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Table {order.table_number || "N/A"}
                      </h2>

                      {order.customer_name && (
                        <p className="text-sm text-gray-600">
                          Customer: {order.customer_name}
                        </p>
                      )}

                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      {order.status || "new"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between border-b pb-1 text-sm"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>

                        <span>
                          ₹
                          {(
                            Number(item.price || 0) *
                            Number(item.quantity || 1)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status === "new" && (
                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "preparing")
                        }
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-white"
                      >
                        Mark Preparing
                      </button>
                    )}

                    {order.status === "preparing" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                      >
                        Mark Ready
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg bg-black px-4 py-2 text-white"
                    >
                      Generate Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow print:shadow-none">
            {!selectedOrder ? (
              <div className="text-gray-500 print:hidden">
                Select an order to generate bill.
              </div>
            ) : (
              <div id="receipt">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold">
                    {restaurant?.name || "MenuAI Restaurant"}
                  </h2>

                  <p className="text-sm text-gray-500">Printable Receipt</p>
                </div>

                <div className="mb-4 text-sm">
                  <p>
                    <strong>Order ID:</strong> {selectedOrder.id}
                  </p>

                  <p>
                    <strong>Table:</strong> {selectedOrder.table_number || "N/A"}
                  </p>

                  {selectedOrder.customer_name && (
                    <p>
                      <strong>Customer:</strong> {selectedOrder.customer_name}
                    </p>
                  )}

                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="mb-4 border-y py-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="mb-2 flex justify-between">
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{bill.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Tax %</span>

                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-24 rounded border px-2 py-1 text-right print:hidden"
                    />

                    <span className="hidden print:inline">{taxPercent}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax Amount</span>
                    <span>₹{bill.taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Service Charge</span>

                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value))}
                      className="w-24 rounded border px-2 py-1 text-right print:hidden"
                    />

                    <span className="hidden print:inline">
                      ₹{bill.service.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Grand Total</span>
                    <span>₹{bill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 print:hidden">
                  <label className="mb-1 block text-sm font-medium">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Online</option>
                  </select>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                  <button
                    onClick={saveBill}
                    className="rounded-lg bg-green-600 px-5 py-2 text-white"
                  >
                    Mark Paid & Complete
                  </button>

                  <button
                    onClick={printReceipt}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-white"
                  >
                    Print Receipt
                  </button>

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-lg bg-gray-500 px-5 py-2 text-white"
                  >
                    Cancel
                  </button>
                </div>

                <p className="mt-8 hidden text-center text-sm print:block">
                  Thank you. Visit again!
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}