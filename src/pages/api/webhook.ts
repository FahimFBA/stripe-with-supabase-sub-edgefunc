import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable Next.js body parsing for this route to access the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err: any) {
      console.error(`❌ Error message: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('✅ Success:', event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout Session Completed:', session.id);
        // If it's a subscription, the 'invoice.paid' event might be more relevant for granting access.
        // If it's a one-time payment, you might fulfill the order here.
        // Example: Get customer details, update database, etc.
        // const customerId = session.customer;
        // const subscriptionId = session.subscription;
        // await supabase.from('your_table').update({ status: 'active' }).eq('stripe_customer_id', customerId);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice Paid:', invoice.id);
        // Used for recurring payments. Update user's subscription status or grant access.
        // const customerId = invoice.customer;
        // const subscriptionId = invoice.subscription;
        // Find user by customerId and update their subscription end date or status.
        // await supabase.from('your_table').update({ status: 'active', current_period_end: new Date(invoice.period_end * 1000) }).eq('stripe_customer_id', customerId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice Payment Failed:', invoice.id);
        // Handle failed payments, maybe notify the user or update status.
        // const customerId = invoice.customer;
        // await supabase.from('your_table').update({ status: 'payment_failed' }).eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription Updated:', subscription.id);
        // Handle changes in subscription status (e.g., cancellation, upgrade/downgrade).
        // const customerId = subscription.customer;
        // const status = subscription.status;
        // const current_period_end = new Date(subscription.current_period_end * 1000);
        // await supabase.from('your_table').update({ status: status, current_period_end: current_period_end }).eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription Deleted:', subscription.id);
        // Handle subscription cancellation. Update user status in your DB.
        // const customerId = subscription.customer;
        // await supabase.from('your_table').update({ status: 'canceled' }).eq('stripe_customer_id', customerId);
        break;
      }
      // ... handle other event types as needed
      default:
        console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};

export default handler;