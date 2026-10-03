import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Cart lives in context (not lifted through props) so any page — the
// store, the header badge, a future "recently added" toast — can read or
// change it without threading props through App.jsx. Mirrors the existing
// useAuth() pattern already used across the app.
const CartContext = createContext(null);

const STORAGE_KEY = 'black_couch_cart';

function loadStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    // Private browsing, storage disabled, or corrupted JSON — start empty
    // rather than crash the whole app over a cart.
    return {};
  }
}

export function CartProvider({ children }) {
  // variant_id -> { qty, productName, size, priceCents }
  const [cart, setCart] = useState(loadStoredCart);

  // Persisted so a page refresh (or, as just happened, a dev server
  // restart) doesn't silently empty someone's bag.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage full or blocked — the cart still works in-memory for
      // this session, it just won't survive a refresh.
    }
  }, [cart]);

  function addItem(variantId, meta) {
    setCart((prev) => {
      const existingQty = prev[variantId]?.qty || 0;
      return { ...prev, [variantId]: { ...meta, ...prev[variantId], qty: existingQty + 1 } };
    });
  }

  function setQty(variantId, qty, meta) {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[variantId];
        return next;
      }
      return { ...prev, [variantId]: { ...prev[variantId], ...meta, qty } };
    });
  }

  function removeItem(variantId) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  }

  function clear() {
    setCart({});
  }

  const entries = Object.entries(cart);
  const count = entries.reduce((sum, [, item]) => sum + item.qty, 0);
  const totalCents = entries.reduce((sum, [, item]) => sum + item.qty * item.priceCents, 0);

  const value = useMemo(
    () => ({ cart, entries, count, totalCents, addItem, setQty, removeItem, clear }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
}
