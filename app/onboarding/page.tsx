"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const createRestaurant = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      router.push("/login");
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    const { error } = await supabase.from("restaurants").insert({
      owner_id: user.id,
      name,
      slug: cleanSlug,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Restaurant created successfully.");
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-900 p-8">
        <h1 className="text-3xl font-bold">Create Your Restaurant</h1>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
            placeholder="Restaurant Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
          />

          <input
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
            placeholder="restaurant-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
            placeholder="Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />

          <input
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
            placeholder="Banner URL"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
          />

          <button
            onClick={createRestaurant}
            className="w-full rounded-xl bg-green-600 py-3 font-bold"
          >
            Create Restaurant
          </button>
        </div>
      </div>
    </main>
  );
}