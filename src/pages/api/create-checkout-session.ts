import http from 'http';
import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from 'next';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("Stripe secret key is missing.");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, price } = req.body;

      if (!stripeSecretKey) {
        res.status(500).json({ error: "Stripe secret key is missing." });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name,
              },
              unit_amount: price, // price in cents
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.SUCCESS_URL}`,
        cancel_url: `${process.env.CANCEL_URL}`,
      });

      console.log("Success URL:", process.env.SUCCESS_URL);
      console.log("Cancel URL:", process.env.CANCEL_URL);

      res.status(200).json({ sessionId: session.id });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
