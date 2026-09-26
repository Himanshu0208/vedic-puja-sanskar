export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailure {
  error?: { description?: string };
}

export interface RazorpayCheckout {
  open(): void;
  on(event: 'payment.failed', handler: (response: RazorpayFailure) => void): void;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler(response: RazorpaySuccess): void;
  modal: { ondismiss(): void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

let razorpayScriptPromise: Promise<boolean> | undefined;

export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(!!window.Razorpay);
      script.onerror = () => { razorpayScriptPromise = undefined; resolve(false); };
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}
