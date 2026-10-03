import { useEffect, useMemo, useState } from 'react';
import { api, centsToRands } from '../../lib/api';
import AdminLayout from './AdminLayout.jsx';
import { Notice, cardStyle, fieldGrid } from './AdminParts.jsx';

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EMPTY = { name: '', type: '', description: '', price: '' };

// One size's stock, editable in place on an existing product.
function StockRow({ variant, onSaved, onError }) {
  const [stock, setStock] = useState(String(variant.stock));
  const [saving, setSaving] = useState(false);
  const dirty = stock !== String(variant.stock);

  async function save() {
    const n = Number(stock);
    if (!Number.isInteger(n) || n < 0) return onError('Stock must be a whole number, 0 or higher.');
    setSaving(true);
    try {
      await api.adminUpdateStock(variant.variant_id, n);
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ minWidth: 60 }}>{variant.size}</span>
      <input className="input" type="number" min="0" style={{ width: 80 }} value={stock} onChange={(e) => setStock(e.target.value)} aria-label={`Stock for ${variant.size}`} />
      <button className="filter" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
    </div>
  );
}

export default function AdminProducts() {
  const [form, setForm] = useState(EMPTY);
  const [sizes, setSizes] = useState({}); // size -> stock (string)
  const [customSize, setCustomSize] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  function refresh() {
    setLoading(true);
    api
      .adminProducts()
      .then((d) => setProducts(d.products))
      .catch((err) => setNotice({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }
  useEffect(refresh, []);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const existingTypes = useMemo(() => [...new Set(products.map((p) => p.type))], [products]);

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleSize(size) {
    setSizes((current) => {
      const next = { ...current };
      if (size in next) delete next[size];
      else next[size] = '0';
      return next;
    });
  }

  function addCustomSize() {
    const s = customSize.trim();
    if (s && !(s in sizes)) setSizes((current) => ({ ...current, [s]: '0' }));
    setCustomSize('');
  }

  function handleImage(e) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_IMAGE_BYTES) {
      e.target.value = '';
      return setNotice({ type: 'error', text: 'Image must be under 5MB.' });
    }
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    const priceRands = Number(form.price);
    if (!(priceRands > 0)) return setNotice({ type: 'error', text: 'Enter a price greater than 0.' });

    const variants = Object.entries(sizes).map(([size, stock]) => ({ size, stock: Number(stock) }));
    if (variants.length === 0) return setNotice({ type: 'error', text: 'Pick at least one size.' });
    if (variants.some((v) => !Number.isInteger(v.stock) || v.stock < 0)) {
      return setNotice({ type: 'error', text: 'Stock must be a whole number, 0 or higher, for every size.' });
    }
    if (!image) return setNotice({ type: 'error', text: 'Add a product photo.' });

    // Money travels as integer cents, same as the rest of the app.
    const body = new FormData();
    body.append('name', form.name.trim());
    body.append('type', form.type.trim());
    body.append('description', form.description.trim());
    body.append('price_cents', String(Math.round(priceRands * 100)));
    body.append('variants', JSON.stringify(variants));
    body.append('image', image);

    setSaving(true);
    try {
      await api.adminCreateProduct(body);
      setNotice({ type: 'success', text: `${form.name.trim()} added to the store.` });
      setForm(EMPTY);
      setSizes({});
      setImage(null);
      setPreview('');
      e.target.reset();
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="container" style={{ padding: '40px 0 60px' }}>
        <h1 style={{ margin: '0 0 6px' }}>Clothing &amp; merch</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Add new items to the store and keep stock levels up to date.</p>

        <form className="form" onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Add an item</h2>
          <div style={fieldGrid}>
            <label>Name<input className="input" name="name" value={form.name} onChange={update} maxLength={150} required /></label>
            <label>
              Type
              <input className="input" name="type" list="product-types" value={form.type} onChange={update} maxLength={60} placeholder="e.g. Hoodie, Tee, Cap" required />
              <datalist id="product-types">{existingTypes.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <label>Price (R)<input className="input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} required /></label>
            <label>
              Photo (JPG, PNG or WEBP, max 5MB)
              <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} />
            </label>
          </div>
          {preview && <img src={preview} alt="Selected product preview" style={{ width: 96, height: 96, objectFit: 'cover', border: '1px solid var(--line)' }} />}
          <label>Description<textarea className="input textarea" name="description" value={form.description} onChange={update} maxLength={600} required /></label>

          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Sizes &amp; stock</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...PRESET_SIZES, ...Object.keys(sizes).filter((s) => !PRESET_SIZES.includes(s))].map((size) => (
                <button type="button" key={size} className={`filter ${size in sizes ? 'active' : ''}`} onClick={() => toggleSize(size)}>
                  {size}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input className="input" style={{ maxWidth: 200 }} placeholder="Custom size (e.g. Kids 8)" value={customSize} onChange={(e) => setCustomSize(e.target.value)} maxLength={20} />
              <button type="button" className="filter" onClick={addCustomSize}>Add size</button>
            </div>
            {Object.keys(sizes).length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                {Object.entries(sizes).map(([size, stock]) => (
                  <label key={size} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ minWidth: 70 }}>{size}</span>
                    <input className="input" type="number" min="0" style={{ width: 100 }} value={stock} onChange={(e) => setSizes((c) => ({ ...c, [size]: e.target.value }))} />
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>in stock</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Notice notice={notice} />
          <div>
            <button className="button" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add to store'}</button>
          </div>
        </form>

        <h2 style={{ margin: '44px 0 0', fontSize: 22 }}>In the store ({products.length})</h2>
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!loading && products.length === 0 && <p style={{ color: 'var(--muted)' }}>Nothing in the store yet.</p>}
        {products.map((product) => (
          <article key={product.id} style={{ display: 'flex', gap: 18, flexWrap: 'wrap', borderBottom: '1px solid var(--line)', padding: '20px 0' }}>
            {product.image && <img src={product.image} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid var(--line)' }} />}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3 style={{ margin: 0 }}>{product.name}</h3>
              <p style={{ margin: '2px 0 12px', color: 'var(--muted)', fontSize: 14 }}>
                {product.type} · {centsToRands(product.price_cents)}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {product.variants.map((variant) => (
                  <StockRow
                    key={variant.variant_id}
                    variant={variant}
                    onSaved={() => { setNotice({ type: 'success', text: `${product.name} (${variant.size}) stock updated.` }); refresh(); }}
                    onError={(text) => setNotice({ type: 'error', text })}
                  />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
