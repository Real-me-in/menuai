"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ProtectedPage from "@/components/ProtectedPage";
import { useRestaurant } from "@/contexts/RestaurantContext";

type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter";

export default function BillingPage() {
  const { restaurant, loading: restaurantLoading } =
    useRestaurant();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (restaurantLoading) return;

    async function checkAccess() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("restaurant_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const userRole = roleData?.role as UserRole | undefined;

      // ONLY OWNER + CASHIER
      if (
        !userRole ||
        !["owner", "cashier"].includes(userRole)
      ) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setAuthorized(true);
      setLoading(false);
    }

    checkAccess();
  }, [restaurantLoading]);

  if (loading || restaurantLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading billing...
        </main>
      </ProtectedPage>
    );
  }

  if (!authorized) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div>
            <h1 className="text-4xl font-bold text-red-500">
              Access denied
            </h1>

            <p className="mt-4 text-zinc-300">
              Only owner and cashier accounts can access billing.
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

      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-5xl font-black">
              {restaurant?.name || "Restaurant"} Billing
            </h1>

            <p className="mt-3 text-zinc-400">
              Secure cashier and payment operations
            </p>

            <div className="mt-3 inline-block rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
              Logged in as: {role}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold">Receipts</h2>

              <p className="mt-3 text-zinc-400">
                Generate and manage customer receipts.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold">Payments</h2>

              <p className="mt-3 text-zinc-400">
                Track paid and pending restaurant orders.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold">
                Cashier Console
              </h2>

              <p className="mt-3 text-zinc-400">
                Operational billing tools for authorized billing staff only.
              </p>
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}