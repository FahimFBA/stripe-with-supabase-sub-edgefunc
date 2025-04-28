# Stripe Subscriptions with Supabase Edge Function

This project demonstrates integrating Stripe for handling payments and subscriptions within a Next.js application, utilizing a Supabase Edge Function to create checkout sessions and a Next.js API route to handle Stripe webhooks for post-payment events.

## Tech Stack

*   **Frontend:** Next.js (v15+), React (v19+)
*   **Styling:** Tailwind CSS (v4+)
*   **Backend/Database:** Supabase (Client v2+, Edge Functions with Deno)
*   **Payments:** Stripe (API v2023-10-16, stripe-js v3+)
*   **Language:** TypeScript

## Project Structure

```
.
├── .env.example             # Example environment variables
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── public/                  # Static assets
├── rc/                      # React components (likely 'rc' stands for React Components)
│   └── components/
├── src/                     # Source code
│   ├── lib/                 # Utility functions (Stripe, Supabase clients)
│   │   ├── stripe.ts
│   │   └── supabaseClient.ts
│   ├── pages/               # Next.js pages and API routes
│   │   ├── api/             # API routes
│   │   │   ├── create-checkout-session.ts # (Potentially deprecated if using Edge Function)
│   │   │   └── webhook.ts   # Stripe webhook handler
│   │   ├── _app.tsx         # Custom App component
│   │   ├── index.tsx        # Home page
│   │   ├── success.tsx      # Payment success page
│   │   └── cancel.tsx       # Payment cancellation page
│   └── styles/              # Global styles
└── supabase/                # Supabase specific files
    ├── functions/           # Supabase Edge Functions
    │   └── create-checkout-session/
    │       └── index.ts     # Edge Function for Stripe Checkout
    ├── import_map.json      # Deno import map for Edge Functions
    └── schema.sql           # Database schema (currently empty, manage via UI)
```

## Setup and Configuration

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn
*   Supabase Account & Project
*   Stripe Account
*   Supabase CLI (for deploying Edge Functions): `npm install supabase --save-dev` or `npm install -g supabase`

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd stripe-with-supabase-sub-edgefunc
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    *   Copy `.env.example` to `.env.local`: `cp .env.example .env.local`
    *   Fill in the required values in `.env.local`:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anon key.
        *   `STRIPE_SECRET_KEY`: Your Stripe secret key (e.g., `sk_test_...` or `sk_live_...`). **Keep this secret!**
        *   `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret (e.g., `whsec_...`). Generate this when setting up the webhook endpoint in Stripe.
        *   `SUCCESS_URL`: (Optional) Absolute URL for redirect after successful payment (defaults to `http://localhost:3001/success` in the Edge Function if not set).
        *   `CANCEL_URL`: (Optional) Absolute URL for redirect after cancelled payment (defaults to `http://localhost:3001/cancel` in the Edge Function if not set).
        *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (e.g., `pk_test_...` or `pk_live_...`). Used by `@stripe/stripe-js` on the client-side. *(Note: This wasn't explicitly seen in the provided files but is typically required for client-side Stripe interactions)*.

4.  **Supabase Setup:**
    *   Create a new project on [Supabase](https://supabase.com/).
    *   Find your Project URL and Anon Key in Project Settings > API.
    *   **Database Schema:** The `supabase/schema.sql` file is currently empty. You will need to define your database tables, likely including tables to store user profiles, subscription status, Stripe customer IDs, etc. The commented-out code in `src/pages/api/webhook.ts` provides examples of potential tables and columns (e.g., a table with `stripe_customer_id`, `status`, `current_period_end`). Set up your schema using the Supabase Studio (Table Editor) or by creating and applying SQL migration files.

5.  **Stripe Setup:**
    *   Create a Stripe account or use an existing one.
    *   Find your Secret Key and Publishable Key in the Developers > API keys section.
    *   **Webhook Endpoint:**
        *   Go to Developers > Webhooks.
        *   Click "Add endpoint".
        *   Set the "Endpoint URL" to your deployed webhook handler URL (e.g., `https://your-deployed-app.com/api/webhook` for production, or use the Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhook`).
        *   Select the events to listen for. Based on `src/pages/api/webhook.ts`, you'll need at least:
            *   `checkout.session.completed`
            *   `invoice.paid`
            *   `invoice.payment_failed`
            *   `customer.subscription.updated`
            *   `customer.subscription.deleted`
        *   Click "Add endpoint".
        *   After creation, copy the "Signing secret" (e.g., `whsec_...`) and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Running Locally

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000` (or the port specified in your environment).

## Supabase Edge Function (`create-checkout-session`)

This function, located at `supabase/functions/create-checkout-session/index.ts`, handles the creation of Stripe Checkout Sessions on the server-side using Deno.

### Deployment

1.  **Login to Supabase CLI:**
    ```bash
    supabase login
    ```

2.  **Link your project:**
    ```bash
    supabase link --project-ref <your-project-id>
    ```
    Find `<your-project-id>` in your Supabase project's settings URL.

3.  **Set Secrets:** Set the required environment variables for the function in the Supabase dashboard (Project Settings > Edge Functions > Add New Secret) or via the CLI:
    ```bash
    supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
    supabase secrets set SUCCESS_URL=<your_success_url> # Optional, uses default if not set
    supabase secrets set CANCEL_URL=<your_cancel_url>   # Optional, uses default if not set
    ```
    *Note: Ensure these match the keys used in the function code (`Deno.env.get(...)`).*

4.  **Deploy the function:**
    ```bash
    supabase functions deploy create-checkout-session --no-verify-jwt
    ```
    The `--no-verify-jwt` flag is used here because the function seems intended for public access to initiate checkout, not necessarily tied to an authenticated Supabase user session directly within the function. Adjust if authentication is required.

### CORS Configuration

The function includes CORS headers. The `allowedOrigins` array in `supabase/functions/create-checkout-session/index.ts` defines which frontend domains can call this function. Update this array to include your production domain and potentially `http://localhost:3000` (or your dev port) for local development.

```typescript
// supabase/functions/create-checkout-session/index.ts
const allowedOrigins = [
  'http://localhost:3000', // Your local dev origin
  'https://your-production-domain.com', // Your deployed frontend URL
  // Add other allowed origins if needed
];
```

## Stripe Webhook Handler (`/api/webhook`)

This Next.js API route (`src/pages/api/webhook.ts`) listens for events from Stripe (like successful payments or subscription updates) and verifies their authenticity using the webhook signing secret.

### Functionality

*   Receives POST requests from Stripe.
*   Verifies the request signature using `STRIPE_WEBHOOK_SECRET`.
*   Processes different event types (`checkout.session.completed`, `invoice.paid`, etc.).
*   **Database Interaction:** Contains commented-out examples for updating your Supabase database based on Stripe events. You **must** uncomment and adapt this logic to match your specific database schema and application requirements (e.g., updating user subscription status, granting access to features).

### Local Testing

Use the Stripe CLI to forward webhook events to your local development server:

```bash
# Install Stripe CLI if you haven't: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhook
```

This command will provide a temporary webhook secret (`whsec_...`) for testing. Use this temporary secret in your `.env.local` while testing locally, or configure Stripe to use your actual endpoint secret.

## Deployment (Next.js App)

Deploy the Next.js application to a hosting provider like Vercel, Netlify, or others that support Node.js applications.

*   **Environment Variables:** Ensure all required environment variables from your `.env.local` (especially `NEXT_PUBLIC_` variables, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`) are configured in your hosting provider's settings.
*   **Webhook URL:** Update your Stripe webhook endpoint URL to point to the deployed API route (`https://your-deployed-app.com/api/webhook`).
*   **Edge Function CORS:** Ensure the `allowedOrigins` in your deployed Edge Function includes your production frontend domain.