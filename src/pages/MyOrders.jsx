import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Package, UploadCloud, XCircle } from 'lucide-react';
import { api, centsToRands } from '../lib/api';
import { PageIntro } from '../components/PageParts.jsx';

const STATUS = {
  pending_payment: { label: 'Awaiting payment verification', color: '#9a7b1f', Icon: Clock },
  approved: { label: 'Approved', color: '#2e7d32', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#b3261e', Icon: XCircle },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function StatusBadge({ status }) {
  const info = STATUS[status] || { label: status, color: 'var(--muted)', Icon: Clock };
  const { Icon } = info;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: info.color,
        fontWeight: 600,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '.02em',
        border: `1px solid ${info.color}`,
        borderRadius: 999,
        padding: '4px 12px',
      }}
    >
      <Icon size={13} />
      {info.label}
    </span>
  );
}

function UploadProofForm({ orderId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function handleFileChange(e) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return picked && picked.type.startsWith('image/') ? URL.createObjectURL(picked) : '';
    });
  }

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await api.uploadProof(orderId, file);
      setDone(true);
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#2e7d32', marginTop: 12 }}
      >
        <CheckCircle2 size={16} /> Proof uploaded — Kingsley will verify it shortly.
      </motion.p>
    );
  }

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
      style={{ marginTop: 14, padding: 16, border: '1px dashed var(--line)', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Selected proof preview" style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--line)' }} />
      ) : (
        <span
          style={{
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            flexShrink: 0,
          }}
        >
          <UploadCloud size={20} />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={{ fontSize: 14 }}>
          Upload proof of payment (JPG, PNG, WEBP or PDF, max 8MB)
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="filter" type="submit" disabled={uploading || !file} style={{ marginTop: 8 }}>
          {uploading ? 'Uploading…' : 'Upload proof'}
        </button>
      </div>
    </form>
  );
}

const EMPTY_ADDRESS = {
  recipient_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  suburb: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'South Africa',
};

// The API returns shipping_address: null until one is saved, and individual
// columns (e.g. address_line_2) can be null too. A default parameter
// (address = {}) only covers `undefined`, so null crashed the page. Coerce
// every field explicitly so inputs always receive strings.
function addressFormValue(address) {
  const source = address ?? {};
  return Object.fromEntries(
    Object.keys(EMPTY_ADDRESS).map((key) => [key, source[key] ?? EMPTY_ADDRESS[key]])
  );
}

const fieldGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

function OrderAddressForm({ order }) {
  const [address, setAddress] = useState(() => addressFormValue(order.shipping_address));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const isEditable = order.status === 'pending_payment';

  // Only reset when the saved address genuinely changes, not on every
  // orders refresh (which hands back new object references and would wipe
  // whatever the customer is midway through typing).
  const savedAddressKey = JSON.stringify(order.shipping_address ?? null);
  useEffect(() => {
    setAddress(addressFormValue(order.shipping_address));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddressKey]);

  function updateField(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await api.saveOrderAddress(order.id, address);
      setAddress(addressFormValue(response.address));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Closed orders: show what was saved (or that nothing was), not a
  // greyed-out empty form.
  if (!isEditable) {
    return (
      <div style={{ marginTop: 18 }}>
        <h4 style={{ margin: '0 0 6px' }}>Delivery address</h4>
        {order.shipping_address ? (
          <address style={{ fontStyle: 'normal', fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
            {address.recipient_name}
            <br />
            {address.address_line_1}
            {address.address_line_2 && `, ${address.address_line_2}`}
            <br />
            {address.suburb}, {address.city}, {address.province} {address.postal_code}
            <br />
            {address.country} · {address.phone}
          </address>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>No delivery address was saved for this order.</p>
        )}
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} style={{ marginTop: 18 }}>
      <h4 style={{ margin: 0 }}>Delivery address</h4>
      <div style={fieldGridStyle}>
        <label>Recipient name<input className="input" name="recipient_name" value={address.recipient_name} onChange={updateField} required maxLength={150} /></label>
        <label>Phone<input className="input" name="phone" type="tel" value={address.phone} onChange={updateField} required maxLength={30} /></label>
        <label>Address line 1<input className="input" name="address_line_1" value={address.address_line_1} onChange={updateField} required maxLength={190} /></label>
        <label>Address line 2<input className="input" name="address_line_2" value={address.address_line_2} onChange={updateField} maxLength={190} /></label>
        <label>Suburb<input className="input" name="suburb" value={address.suburb} onChange={updateField} required maxLength={120} /></label>
        <label>City / town<input className="input" name="city" value={address.city} onChange={updateField} required maxLength={120} /></label>
        <label>Province<input className="input" name="province" value={address.province} onChange={updateField} required maxLength={120} /></label>
        <label>Postal code<input className="input" name="postal_code" value={address.postal_code} onChange={updateField} required maxLength={20} /></label>
        <label>Country<input className="input" name="country" value={address.country} onChange={updateField} required maxLength={100} /></label>
      </div>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status" style={{ color: '#2e7d32' }}>Address saved for this order.</p>}
      <div>
        <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button>
      </div>
    </form>
  );
}

export default function MyOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    api
      .myOrders()
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const newOrderRef = location.state?.newOrderRef;

  return (
    <>
      <PageIntro kicker="Account" title="My Orders" copy="Track the status of every order, add a delivery address, and upload proof of payment for anything awaiting review." />
      <section className="section">
        <div className="container">
          <AnimatePresence>
            {newOrderRef && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ border: '1px dashed var(--line)', padding: 14, marginBottom: 24 }}
              >
                Order <strong>{newOrderRef}</strong> placed! Add your delivery address and upload your proof of payment below.
              </motion.p>
            )}
          </AnimatePresence>

          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

          {!loading && orders.length === 0 && (
            <motion.div className="loading" initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>
              <Package size={32} />
              <p>No orders yet.</p>
            </motion.div>
          )}

          <motion.div variants={listVariants} initial="hidden" animate="show">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.article
                  key={order.id}
                  layout
                  variants={rowVariants}
                  exit={{ opacity: 0 }}
                  style={{ borderBottom: '1px solid var(--line)', padding: '22px 0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{order.order_ref}</h3>
                      <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{centsToRands(order.total_cents)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <OrderAddressForm order={order} />
                  {order.status === 'pending_payment' && <UploadProofForm orderId={order.id} onUploaded={refresh} />}
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </>
  );
}
