"use client";

import { ProductCard } from "../../rc/components/ProductCard";

import { loadStripe } from "@stripe/stripe-js";
import { ServiceCard } from "../../rc/components/ServiceCard"; // Placeholder import

const products = [
  { name: "Premium Mug", price: 2500 }, // Assuming price is in cents for one-time purchase
  { name: "Sticker Pack", price: 800 },
  { name: "T-Shirt", price: 4000 },
];

// Define services with placeholder Price IDs
const services = [
  {
    name: "Basic Plan",
    monthlyPriceId: "price_monthly_placeholder_1",
    yearlyPriceId: "price_yearly_placeholder_1",
  },
  {
    name: "Pro Plan",
    monthlyPriceId: "price_monthly_placeholder_2",
    yearlyPriceId: "price_yearly_placeholder_2",
  },
];


interface HomeProps {
  stripePromise: ReturnType<typeof loadStripe>;
}

export default function Home({ stripePromise }: HomeProps) {
  return (
    <main className="flex flex-col items-center p-10">
      {/* Products Section */}
      <section className="w-full max-w-4xl mb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.name} {...product} stripePromise={stripePromise} />
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {services.map((service) => (
             <ServiceCard key={service.name} {...service} stripePromise={stripePromise} />
           ))}
        </div>
      </section>
    </main>
  );
}
