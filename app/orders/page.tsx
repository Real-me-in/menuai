"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [taxPercent, setTaxPercent] = useState(5);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .not("status", "eq", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading orders: " + error.message);
      return;
    }

    setOrders((data || []) as Order[]);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert("Error updating order: " + error.message);
      return;
    }

    fetchOrders();
  };

  const saveBill = async () => {
    if (!selectedOrder) return;

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
      .eq("id", selectedOrder.id);

    if (error) {
      alert("Error saving bill: " + error.message);
      return;
    }

    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== selectedOrder.id)
    );

    setSelectedOrder(null);
    alert("Bill saved successfully");
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Live Orders Dashboard
      </h1>

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
                          Number(item.price || 0) * Number(item.quantity || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-white"
                  >
                    Preparing
                  </button>

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
                <h2 className="text-2xl font-bold">MenuAI Restaurant</h2>
                <p className="text-sm text-gray-500">Printable Receipt</p>
              </div>

              <div className="mb-4 text-sm">
                <p>
                  <strong>Order ID:</strong> {selectedOrder.id}
                </p>
                <p>
                  <strong>Table:</strong>{" "}
                  {selectedOrder.table_number || "N/A"}
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
                        Number(item.price || 0) * Number(item.quantity || 1)
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
  );
}