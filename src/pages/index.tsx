"use client";

import { ProductCard } from "../../rc/components/ProductCard";

import { loadStripe } from "@stripe/stripe-js";

const products = [
  { name: "Premium Mug", price: 2500 },
  { name: "Sticker Pack", price: 800 },
  { name: "T-Shirt", price: 4000 },
];

interface HomeProps {
  stripePromise: ReturnType<typeof loadStripe>;
}

export default function Home({ stripePromise }: HomeProps) {
  return (
    <main className="flex flex-col items-center p-10">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.name} {...product} stripePromise={stripePromise} />
        ))}
      </div>
    </main>
  );
}
