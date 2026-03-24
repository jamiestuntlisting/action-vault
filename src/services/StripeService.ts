import { Platform } from 'react-native';

interface CheckoutParams {
  type: 'video' | 'course';
  id: string;
  title: string;
  price: number;
}

interface VerifyResult {
  verified: boolean;
  type?: 'video' | 'course';
  id?: string;
  reason?: string;
}

const API_BASE = Platform.OS === 'web'
  ? '' // Same origin on web
  : 'https://actionvault.stuntlisting.com'; // Production URL for native

export const StripeService = {
  async initiateCheckout(params: CheckoutParams): Promise<void> {
    const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: params.type,
        id: params.id,
        title: params.title,
        priceInCents: Math.round(params.price * 100),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionUrl } = await response.json();

    if (Platform.OS === 'web') {
      // Open Stripe checkout in a centered popup window
      const width = 500;
      const height = 700;
      const left = Math.round((window.screen.width - width) / 2);
      const top = Math.round((window.screen.height - height) / 2);
      const popup = window.open(
        sessionUrl,
        'stripe-checkout',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      // If popup was blocked, fall back to redirect
      if (!popup || popup.closed) {
        window.location.href = sessionUrl;
      }
    } else {
      // For native, use Linking to open Stripe checkout in browser
      const { Linking } = require('react-native');
      await Linking.openURL(sessionUrl);
    }
  },

  // Verify a purchase server-side using the Stripe session ID
  async verifyPurchase(sessionId: string): Promise<VerifyResult> {
    try {
      const response = await fetch(`${API_BASE}/api/verify-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        return { verified: false, reason: 'Verification request failed' };
      }

      return await response.json();
    } catch (error) {
      console.error('Purchase verification error:', error);
      return { verified: false, reason: 'Network error' };
    }
  },
};
