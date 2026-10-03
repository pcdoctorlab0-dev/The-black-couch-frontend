import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, centsToRands } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Products() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // variant_id -> { qty, meta }
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.products().then((d) => setProducts(d.products));
  }, []);

  function addToCart(product, variant) {
    setCart((prev) => {
      const existing = prev[variant.variant_id]?.qty || 0;
      return {
        ...prev,
        [variant.variant_id]: {
          qty: existing + 1,
          productName: product.name,
          size: variant.size,
          priceCents: product.price_cents,
        },
      };
    });
  }

  function removeFromCart(variantId) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  }

  const cartEntries = Object.entries(cart);
  const cartTotal = cartEntries.reduce((sum, [, item]) => sum + item.qty * item.priceCents, 0);

  async function handleCheckout() {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setPlacing(true);
    try {
      const items = cartEntries.map(([variantId, item]) => ({
        variant_id: Number(variantId),
        quantity: item.qty,
      }));
      const { order } = await api.checkout(items);
      setCart({});
      // Send them straight to My Orders so they can upload proof of payment.
      navigate('/orders', { state: { newOrderRef: order.order_ref } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section>
      <h1>The Black Couch Store</h1>

      {products.map((product) => (
        <article key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>{centsToRands(product.price_cents)}</p>
          <ul>
            {product.variants.map((v) => (
              <li key={v.variant_id}>
                {v.size} — {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}{' '}
                <button disabled={v.stock <= 0} onClick={() => addToCart(product, v)}>
                  Add to cart
                </button>
              </li>
            ))}
          </ul>
        </article>
      ))}

      <aside>
        <h2>Cart</h2>
        {cartEntries.length === 0 && <p>Your cart is empty.</p>}
        <ul>
          {cartEntries.map(([variantId, item]) => (
            <li key={variantId}>
              {item.productName} ({item.size}) × {item.qty} — {centsToRands(item.qty * item.priceCents)}{' '}
              <button onClick={() => removeFromCart(variantId)}>Remove</button>
            </li>
          ))}
        </ul>
        {cartEntries.length > 0 && (
          <>
            <p>Delivery: R80.00 (added at checkout)</p>
            <p>
              <strong>Total (excl. delivery): {centsToRands(cartTotal)}</strong>
            </p>
            {error && <p role="alert">{error}</p>}
            <button onClick={handleCheckout} disabled={placing}>
              {placing ? 'Placing order…' : 'Checkout'}
            </button>
            {!ready ? null : !user && <p>You'll be asked to log in first.</p>}
          </>
        )}
      </aside>
    </section>
  );
}
