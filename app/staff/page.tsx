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

type StaffUser = {
  id: string;
  user_id: string | null;
  email: string | null;
  restaurant_id: string;
  role: UserRole;
  active: boolean | null;
  status?: string | null;
  created_at?: string;
};

export default function StaffPage() {
  const { restaurant, restaurantId, loading: restaurantLoading } =
    useRestaurant();

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("waiter");
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from("restaurant_users")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading staff: " + error.message);
      return;
    }

    setStaff((data || []) as StaffUser[]);
  };

  useEffect(() => {
    if (restaurantLoading) return;

    async function checkAccessAndLoad() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !restaurantId) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("restaurant_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = roleData?.role as UserRole | undefined;

      if (!role || !["owner", "manager"].includes(role)) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setCurrentRole(role);
      setAuthorized(true);

      await fetchStaff();
      setLoading(false);
    }

    checkAccessAndLoad();
  }, [restaurantId, restaurantLoading]);

  const addStaff = async () => {
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Enter staff email address");
      return;
    }

    if (!cleanEmail.includes("@")) {
      alert("Enter a valid email address");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Session expired. Please login again.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/invite-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: cleanEmail,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error inviting staff: " + (data.error || "Unknown error"));
        setSaving(false);
        return;
      }

      setNewEmail("");
      setNewRole("waiter");
      await fetchStaff();

      alert(
        "Staff invite added. Ask the staff member to sign up using this same email."
      );
    } catch (err) {
      console.error(err);
      alert("Error inviting staff.");
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (id: string, role: UserRole) => {
    const { error } = await supabase
      .from("restaurant_users")
      .update({ role })
      .eq("id", id);

    if (error) {
      alert("Error updating role: " + error.message);
      return;
    }

    fetchStaff();
  };

  const toggleActive = async (id: string, active: boolean | null) => {
    const { error } = await supabase
      .from("restaurant_users")
      .update({ active: !active })
      .eq("id", id);

    if (error) {
      alert("Error updating staff status: " + error.message);
      return;
    }

    fetchStaff();
  };

  if (loading || restaurantLoading) {
    return (
      <ProtectedPage>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading staff...
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
              Only owners and managers can manage staff.
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
              {restaurant?.name || "Restaurant"} Staff
            </h1>

            <p className="mt-3 text-zinc-400">
              Invite staff and manage access permissions.
            </p>

            <div className="mt-3 inline-block rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
              Logged in as: {currentRole}
            </div>
          </div>

          <section className="mb-8 rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              Invite Staff
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@example.com"
                type="email"
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
              />

              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as UserRole)
                }
                className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
              >
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen</option>
                <option value="waiter">Waiter</option>
              </select>

              <button
                onClick={addStaff}
                disabled={saving}
                className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving ? "Inviting..." : "Invite Staff"}
              </button>
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              The staff member should sign up using the same email address.
              MenuAI will link them to this restaurant automatically.
            </p>
          </section>

          <section className="rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-4 text-2xl font-bold">
              Current Staff
            </h2>

            <div className="space-y-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl border border-zinc-800 bg-black p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {member.email || "No email saved"}
                      </div>

                      <div className="mt-1 font-mono text-xs text-zinc-500">
                        {member.user_id
                          ? `Linked user: ${member.user_id}`
                          : "Invite pending"}
                      </div>

                      <div className="mt-2 text-sm">
                        Status:{" "}
                        <span
                          className={
                            member.active === false
                              ? "font-bold text-red-400"
                              : "font-bold text-green-400"
                          }
                        >
                          {member.active === false
                            ? "Inactive"
                            : member.status || "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateRole(
                            member.id,
                            e.target.value as UserRole
                          )
                        }
                        disabled={member.role === "owner"}
                        className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-white"
                      >
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="waiter">Waiter</option>
                      </select>

                      <button
                        onClick={() =>
                          toggleActive(member.id, member.active)
                        }
                        disabled={member.role === "owner"}
                        className="rounded-xl bg-zinc-700 px-4 py-2 font-bold text-white disabled:opacity-40"
                      >
                        {member.active === false
                          ? "Activate"
                          : "Deactivate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {staff.length === 0 && (
                <div className="rounded-xl bg-black p-6 text-zinc-400">
                  No staff records found.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}