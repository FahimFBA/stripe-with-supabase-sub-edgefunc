"use client";

import { loadStripe } from "@stripe/stripe-js";
import React from "react";

interface ServiceCardProps {
  name: string;
  monthlyPriceId: string; // Placeholder
  yearlyPriceId: string; // Placeholder
  stripePromise: ReturnType<typeof loadStripe>;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  monthlyPriceId,
  yearlyPriceId,
  stripePromise,
}) => {
  const handleCheckout = async (priceId: string) => {
    console.log(`Initiating checkout for price ID: ${priceId}`);
    // TODO: Implement checkout logic
    // Call the Supabase edge function directly, passing the priceId.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase URL or Anon Key is not defined in environment variables.");
      // Handle error display to the user here
      return;
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
    console.log("Attempting to fetch:", edgeFunctionUrl); // Log the URL
    console.log("Using Anon Key:", supabaseAnonKey ? 'Exists' : 'MISSING!'); // Verify key exists

    try {
      console.log("Fetch Headers:", {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      });
      console.log("Fetch Body:", JSON.stringify({ priceId }));

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`, // Add Supabase Anon Key
        },
        body: JSON.stringify({ priceId }), // Send the selected price ID
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        console.error("Stripe.js has not loaded yet.");
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe checkout error:", error);
        // Handle error display to the user here
      }
    } catch (error: any) { // Add type annotation
      console.error("Fetch failed:", error); // Log the specific fetch error
      // Log additional details if available
      if (error instanceof TypeError) {
        console.error("TypeError details:", error.message);
      }
      // Handle error display to the user here
      alert(`Checkout failed: ${error.message || 'Unknown error'}`); // Provide basic feedback
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-md flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4">{name}</h2>
      {/* Add more details about the service if needed */}
      <div className="flex space-x-4 mt-auto">
        <button
          onClick={() => handleCheckout(monthlyPriceId)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Monthly Plan
        </button>
        <button
          onClick={() => handleCheckout(yearlyPriceId)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Yearly Plan (Save!)
        </button>
      </div>
    </div>
  );
};