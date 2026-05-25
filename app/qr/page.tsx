"use client";

import AppNav from "@/components/AppNav";
import { useRestaurant } from "@/contexts/RestaurantContext";

export default function QRPage() {
  const { restaurant, restaurantSlug } = useRestaurant();

  const menuUrl = `https://menuai-tau.vercel.app/menu/${restaurantSlug}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    menuUrl
  )}`;

  return (
    <>
      <AppNav />

      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center text-black shadow-xl">
          <h1 className="mb-4 text-3xl font-bold">
            {restaurant?.name || "Restaurant"} QR Code
          </h1>

          <img
            src={qrUrl}
            alt="Restaurant QR Code"
            className="mx-auto mb-6 h-72 w-72"
          />

          <p className="break-all rounded-xl bg-gray-100 p-3 text-sm">
            {menuUrl}
          </p>

          <a
            href={qrUrl}
            download={`${restaurantSlug}-qr.png`}
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-bold text-white"
          >
            Download QR Code
          </a>
        </div>
      </main>
    </>
  );
}