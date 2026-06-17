import { useCallback, useEffect, useState } from 'react';

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function loadCashfreeSdk() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

export function useCashfreeCheckout() {
  const [ready, setReady] = useState(false);
  const mode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').toLowerCase();

  useEffect(() => {
    loadCashfreeSdk()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  const openCheckout = useCallback(
    async (paymentSessionId) => {
      if (!paymentSessionId) throw new Error('Missing payment session');
      const Cashfree = await loadCashfreeSdk();
      const cashfree = Cashfree({ mode });
      return cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      });
    },
    [mode],
  );

  return { ready, openCheckout, mode };
}
