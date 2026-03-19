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
      window.location.href = sessionUrl;
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
