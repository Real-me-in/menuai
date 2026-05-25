"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRestaurant } from "@/contexts/RestaurantContext";

type UserRole =
  | "owner"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter";

export default function AppNav() {
  const pathname = usePathname();

  const {
    restaurants,
    restaurantSlug,
    setCurrentRestaurant,
  } = useRestaurant();

  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("restaurant_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setRole((data?.role as UserRole) || null);
    }

    loadRole();
  }, []);

  const canSeeDashboard =
    role === "owner" || role === "manager";

  const canSeeOrders =
    role === "owner" ||
    role === "manager" ||
    role === "cashier" ||
    role === "waiter";

  const canSeeKitchen =
    role === "owner" ||
    role === "manager" ||
    role === "kitchen";

  const canSeeBilling =
    role === "owner" || role === "cashier";

  const canSeeAdmin =
    role === "owner";

  const canSeeStaff =
    role === "owner" || role === "manager";

  const canSeeMenu =
    role === "owner" || role === "manager";

  const canSeeQr =
    role === "owner" || role === "manager";

  const linkClass = (path: string) => {
    const active =
      pathname === path ||
      (path === "/menu" && pathname.startsWith("/menu")) ||
      (path === "/admin" && pathname.startsWith("/admin")) ||
      (path === "/staff" && pathname.startsWith("/staff")) ||
      (path === "/qr" && pathname.startsWith("/qr"));

    return active
      ? "rounded-xl bg-white px-4 py-2 font-bold text-black transition"
      : "rounded-xl bg-zinc-800 px-4 py-2 font-bold text-white transition hover:bg-zinc-700";
  };

  async function handleLogout() {
    try {
      await supabase.auth.signOut();

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-2xl font-black tracking-tight text-white"
          >
            MenuAI
          </Link>

          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
            LIVE
          </span>

          {restaurants.length > 0 && (
            <select
              value={restaurantSlug || ""}
              onChange={(e) => {
                const selected = restaurants.find(
                  (r) => r.slug === e.target.value
                );

                if (selected) {
                  setCurrentRestaurant(selected);
                  window.location.reload();
                }
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-white outline-none"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          {role && (
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold uppercase text-zinc-300">
              {role}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canSeeDashboard && (
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
          )}

          {canSeeOrders && (
            <Link href="/orders" className={linkClass("/orders")}>
              Orders
            </Link>
          )}

          {canSeeKitchen && (
            <Link href="/kitchen" className={linkClass("/kitchen")}>
              Kitchen
            </Link>
          )}

          {canSeeBilling && (
            <Link href="/billing" className={linkClass("/billing")}>
              Billing
            </Link>
          )}

          {canSeeAdmin && (
            <Link href="/admin" className={linkClass("/admin")}>
              Admin
            </Link>
          )}

          {canSeeStaff && (
            <Link href="/staff" className={linkClass("/staff")}>
              Staff
            </Link>
          )}

          {canSeeMenu && restaurantSlug && (
            <Link
              href={`/menu/${restaurantSlug}?admin=true`}
              className={linkClass("/menu")}
            >
              Menu
            </Link>
          )}

          {canSeeQr && (
            <Link href="/qr" className={linkClass("/qr")}>
              QR Code
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}