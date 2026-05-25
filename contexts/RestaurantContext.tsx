"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  banner_url?: string | null;
};

type RestaurantContextType = {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurants: Restaurant[];
  loading: boolean;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(
  undefined
);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurants() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRestaurant(null);
        setRestaurants([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("restaurant_users")
        .select(
          `
          restaurant_id,
          role,
          active,
          created_at,
          restaurants (
            id,
            name,
            slug,
            logo_url,
            banner_url
          )
        `
        )
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("RestaurantContext error:", error);
        setRestaurant(null);
        setRestaurants([]);
        setLoading(false);
        return;
      }

      const mappedRestaurants = data
        .map((row: any) => row.restaurants)
        .filter(Boolean) as Restaurant[];

      setRestaurants(mappedRestaurants);

      const savedSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("menuai_current_restaurant_slug")
          : null;

      const savedRestaurant =
        savedSlug && mappedRestaurants.find((r) => r.slug === savedSlug);

      const selected =
        savedRestaurant || mappedRestaurants[0] || null;

      setRestaurant(selected);

      if (selected) {
        localStorage.setItem("menuai_current_restaurant_slug", selected.slug);
      } else {
        localStorage.removeItem("menuai_current_restaurant_slug");
      }

      setLoading(false);
    }

    loadRestaurants();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadRestaurants();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function setCurrentRestaurant(nextRestaurant: Restaurant) {
    setRestaurant(nextRestaurant);
    localStorage.setItem(
      "menuai_current_restaurant_slug",
      nextRestaurant.slug
    );
  }

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        restaurantId: restaurant?.id || null,
        restaurantSlug: restaurant?.slug || null,
        restaurants,
        loading,
        setCurrentRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);

  if (!context) {
    throw new Error("useRestaurant must be used inside RestaurantProvider");
  }

  return context;
}