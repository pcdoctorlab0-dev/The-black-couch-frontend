import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { api, centsToRands } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';
import { useCart } from '../lib/CartContext.jsx';
import { PageIntro, SectionHeading } from '../components/PageParts.jsx';

const DELIVERY_CENTS = 8000; // R80 flat delivery shown at checkout, not charged here

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// A size renders as a pill. No quantity yet → "Add". Already in the bag →
// an inline − qty + stepper right on the card, so adjusting doesn't
// require a trip down to the cart panel. Out of stock → disabled, greyed.
function SizePill({ product, variant, onAdd }) {
  const { cart, setQty } = useCart();
  const qty = cart[variant.variant_id]?.qty || 0;
  const soldOut = variant.stock <= 0;

  if (soldOut) {
    return (
      <span
        style={{
          fontSize: 13,
          color: 'var(--muted)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '5px 12px',
          opacity: 0.5,
        }}
      >
        {variant.size} · Sold out
      </span>
    );
  }

  if (qty === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.92 }}
        className="filter"
        style={{ borderRadius: 999 }}
        onClick={() => onAdd(variant)}
      >
        + {variant.size}
      </motion.button>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: '4px 6px 4px 12px',
        fontSize: 13,
      }}
    >
      <span>{variant.size}</span>
      <button
        aria-label={`Remove one ${variant.size}`}
        onClick={() => setQty(variant.variant_id, qty - 1)}
        style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--line)', background: 'none', cursor: 'pointer' }}
      >
        −
      </button>
      <strong style={{ minWidth: 14, textAlign: 'center' }}>{qty}</strong>
      <button
        aria-label={`Add one more ${variant.size}`}
        disabled={qty >= variant.stock}
        onClick={() => setQty(variant.variant_id, qty + 1)}
        style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--line)', background: 'none', cursor: 'pointer' }}
      >
        +
      </button>
    </motion.div>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <motion.article
      className="product-card"
      variants={cardVariants}
      whileHover={{ y: -6, boxShadow: '0 14px 30px rgba(0,0,0,.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <img src={product.image} alt={`${product.name} preview`} loading="lazy" decoding="async" />
      <div className="product-body">
        <p className="eyebrow">{product.type}</p>
        <div className="product-meta">
          <h3>{product.name}</h3>
          <span className="price">{centsToRands(product.price_cents)}</span>
        </div>
        <p className="product-description">{product.description}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {product.variants.map((variant) => (
            <SizePill key={variant.variant_id} product={product} variant={variant} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export default function Store() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const { entries, count, totalCents, addItem, removeItem, clear } = useCart();
  const [products, setProducts] = useState([]);
  const [type, setType] = useState('All');
  const [loadError, setLoadError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api
      .products()
      .then((d) => setProducts(d.products))
      .catch(() => setLoadError('Could not load the store right now — please refresh.'));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const types = useMemo(() => ['All', ...new Set(products.map((p) => p.type))], [products]);
  const visible = type === 'All' ? products : products.filter((p) => p.type === type);

  function handleAdd(product, variant) {
    addItem(variant.variant_id, {
      productName: product.name,
      size: variant.size,
      priceCents: product.price_cents,
    });
    setToast(`${product.name} (${variant.size}) added`);
  }

  async function handleCheckout() {
    if (!user) {
      navigate('/login', { state: { redirectTo: '/store' } });
      return;
    }
    setCheckoutError('');
    setPlacing(true);
    try {
      const items = entries.map(([variantId, item]) => ({
        variant_id: Number(variantId),
        quantity: item.qty,
      }));
      const { order } = await api.checkout(items);
      clear();
      navigate('/orders', { state: { newOrderRef: order.order_ref } });
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      <PageIntro
        kicker="Merch"
        title="The Store"
        copy="Official Black Couch merch. Add items to your bag, then check out with proof of payment Kingsley verifies every order by hand against the account statement before it ships."
      />
      <section className="section">
        <div className="container cart-layout">
          <div className="cart-list">
            <SectionHeading eyebrow="Catalogue" title="Available now" />

            {types.length > 2 && (
              <div className="toolbar">
                {types.map((item) => (
                  <button key={item} className={`filter ${type === item ? 'active' : ''}`} onClick={() => setType(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            {loadError && <p role="alert">{loadError}</p>}
            {!loadError && products.length === 0 && (
              <p style={{ marginTop: 22, color: 'var(--muted)' }}>Nothing in the store yet check back soon.</p>
            )}

            <motion.div className="grid three" style={{ marginTop: 22 }} variants={gridVariants} initial="hidden" animate="show">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={(variant) => handleAdd(product, variant)} />
              ))}
            </motion.div>
          </div>

          <aside className="checkout-panel" style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Your bag {count > 0 && `(${count})`}</h2>
              <AnimatePresence>
                {toast && (
                  <motion.span
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 12, color: 'var(--signal, #2e7d32)' }}
                  >
                    {toast}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {entries.length === 0 ? (
              <motion.div className="loading" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>
                <ShoppingBag size={32} />
                <p>Your bag is empty.</p>
              </motion.div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {entries.map(([variantId, item]) => (
                    <motion.div
                      className="cart-row"
                      key={variantId}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        <p className="eyebrow">{item.size}</p>
                        <h3>{item.productName}</h3>
                        <p>
                          {centsToRands(item.priceCents)} × {item.qty}
                        </p>
                      </div>
                      <button className="filter" onClick={() => removeItem(variantId)}>
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="total">
                  <span>Subtotal</span>
                  <motion.span key={totalCents} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
                    {centsToRands(totalCents)}
                  </motion.span>
                </div>
                <p className="prose" style={{ fontSize: 14 }}>
                  + {centsToRands(DELIVERY_CENTS)} delivery, confirmed with your order.
                </p>
                {checkoutError && <p role="alert">{checkoutError}</p>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="button"
                  style={{ width: '100%' }}
                  disabled={placing}
                  onClick={handleCheckout}
                >
                  {placing ? 'Placing order…' : !ready || user ? 'Check out' : 'Log in to check out'}
                </motion.button>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
