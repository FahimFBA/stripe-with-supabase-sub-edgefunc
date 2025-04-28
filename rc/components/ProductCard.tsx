"use client";

import { loadStripe } from "@stripe/stripe-js";

import { Stripe } from "@stripe/stripe-js";

interface ProductCardProps {
  name: string;
  price: number; // in cents
  stripePromise: Promise<Stripe | null> | null;
}

export const ProductCard = ({ name, price, stripePromise }: ProductCardProps) => {
  const handleBuy = async () => {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price }),
      });
      const data = await res.json();

      if (res.status !== 200) {
        console.error(data.error);
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        console.error("Stripe is not initialized");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="border p-4 rounded shadow-sm flex flex-col items-center">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="text-gray-700">${(price / 100).toFixed(2)}</p>
      <button
        onClick={handleBuy}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Buy Now
      </button>
    </div>
  );
};
