import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Sets the browser tab title on web. No-op on native.
 * Format: "Page Name | Action Vault"
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = title ? `${title} | Action Vault` : 'Action Vault';
    }
  }, [title]);
}
