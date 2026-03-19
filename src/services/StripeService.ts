import { Platform } from 'react-native';

interface CheckoutParams {
  type: 'video' | 'course';
  id: string;
  title: string;
  price: number;
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
};
