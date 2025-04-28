import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Revert to full URL (matching import_map version)
import Stripe from "https://esm.sh/stripe?target=deno&deno-std=0.131.0"; // Revert to full URL (matching import_map version)

// Define allowed origins (replace '*' with your specific frontend domain for better security in production)
// Ensure your development origin (e.g., http://localhost:3001) is included if testing locally.
const allowedOrigins = ['http://localhost:3001', 'https://your-production-domain.com', '*']; // Add localhost and potentially wildcard for dev

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(), // Required for Deno runtime
});

const successUrl = Deno.env.get("SUCCESS_URL") || 'http://localhost:3001/success'; // Fallback URLs
const cancelUrl = Deno.env.get("CANCEL_URL") || 'http://localhost:3001/cancel';

console.log('Function starting...');
const stripeKeyFromEnv = Deno.env.get("STRIPE_SECRET_KEY");
console.log('Stripe Key Loaded:', !!stripeKeyFromEnv);
// Log first few chars for verification (e.g., "sk_test_...") - DO NOT log the full key
console.log('Stripe Key Starts With:', stripeKeyFromEnv ? stripeKeyFromEnv.substring(0, 8) : 'UNDEFINED');
console.log('Success URL:', successUrl);
console.log('Cancel URL:', cancelUrl);


serve(async (req: Request) => { // Added type annotation for req
  const origin = req.headers.get("Origin") || "";
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0], // Check if origin is allowed
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request from:", origin);
    return new Response(null, { headers: corsHeaders, status: 204 }); // Use 204 No Content
  }

  if (req.method === "POST") {
    console.log("Handling POST request from:", origin);
    try {
      const body = await req.json();
      const { name, price, priceId } = body;
      console.log("Request body:", body);

      let sessionConfig: Stripe.Checkout.SessionCreateParams;

      if (priceId) {
        console.log("Creating subscription session for priceId:", priceId);
        // Handle subscription via Price ID
        sessionConfig = {
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
        };
      } else if (name && price) {
        console.log("Creating one-time payment session for:", name, price);
        // Handle one-time payment via price_data
        sessionConfig = {
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name,
                },
                unit_amount: price,
              },
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      } else {
        console.error("Invalid request body:", body);
        throw new Error("Invalid request body: requires either priceId or (name and price)");
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);
      console.log("Stripe session created:", session.id);

      return new Response(
        JSON.stringify({ sessionId: session.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );

    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal Server Error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  }

  // Handle other methods or invalid requests
  console.log("Method not allowed:", req.method);
  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
  );
});

console.log('Function server started.'); // Added log to confirm server start
