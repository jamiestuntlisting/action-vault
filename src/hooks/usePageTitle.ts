import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Sets the browser tab title on web. No-op on native.
 * Format: "Action Vault — <Page Name>"
 *   - Brand prefix first so "Action Vault" stays visible even when the
 *     browser squeezes the tab (truncation happens on the right).
 *   - When no title is supplied, falls back to just "Action Vault".
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = title ? `Action Vault — ${title}` : 'Action Vault';
    }
  }, [title]);
}
