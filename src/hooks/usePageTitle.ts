import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Sets the browser tab title on web. No-op on native.
 * Format: "Page Name | StuntListing TV"
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = title ? `${title} | StuntListing TV` : 'StuntListing TV';
    }
  }, [title]);
}
