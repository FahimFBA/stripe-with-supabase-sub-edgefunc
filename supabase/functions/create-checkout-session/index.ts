import http from 'http';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { name, price } = JSON.parse(body);

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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessionId: session.id }));
      } catch (error) {
        console.error("Stripe error:", error);
        res.writeHead(500);
        res.end("Error creating checkout session");
      }
    });
  } else {
    res.writeHead(405);
    res.end("Method Not Allowed");
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
