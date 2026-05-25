import { supabase } from "@/lib/supabase";

export async function getUserRole(userId: string, restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurant_users")
    .select("role")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error || !data) return null;

  return data.role as "admin" | "staff" | "cashier";
}