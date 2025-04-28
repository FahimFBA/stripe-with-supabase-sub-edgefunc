"use client";

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} stripePromise={stripePromise} />;
}

export default MyApp;
