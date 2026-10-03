import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import AdminLayout from './AdminLayout.jsx';
import { Notice, cardStyle, fieldGrid } from './AdminParts.jsx';

// Cloudinary (unsigned upload straight from the browser). Only the cloud
// name and an *unsigned* preset belong in the frontend .env. The API
// secret must never be put in a VITE_ variable: Vite ships those to the
// browser.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_READY = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_BYTES = 5 * 1024 * 1024;

const EMPTY = {
  episode_number: '',
  title: '',
  guest_name: '',
  category: '',
  description: '',
  youtube_url: '',
  publish_date: '',
};

// Accepts youtube.com/watch?v=<id> and youtu.be/<id>. The backend must
// validate this again — this is only here to catch typos early.
const YOUTUBE_URL = /^https?:\/\/((www\.|m\.)?youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})/;

async function uploadToCloudinary(file) {
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'Image upload failed. Please try again.');
  }
  return data.secure_url;
}

// Small, cropped, auto-format version for the list, so the admin page
// doesn't download full-size covers just to show a thumbnail.
function thumb(url) {
  return url?.includes('/upload/') ? url.replace('/upload/', '/upload/c_fill,w_160,h_90,q_auto,f_auto/') : url;
}

export default function AdminEpisodes() {
  const [form, setForm] = useState(EMPTY);
  const [cover, setCover] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileKey, setFileKey] = useState(0); // remounts the file input to clear it
  const uploadedRef = useRef(null); // { file, url } so a retry doesn't re-upload
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(''); // '', 'Uploading image…', 'Saving episode…'
  const [notice, setNotice] = useState(null);
  const saving = phase !== '';

  function refresh() {
    setLoading(true);
    api
      .adminEpisodes()
      .then((d) => setEpisodes(d.episodes))
      .catch((err) => setNotice({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleCover(e) {
    const file = e.target.files?.[0] ?? null;
    if (file && !COVER_TYPES.includes(file.type)) {
      e.target.value = '';
      return setNotice({ type: 'error', text: 'Cover image must be a JPG, PNG or WEBP.' });
    }
    if (file && file.size > MAX_COVER_BYTES) {
      e.target.value = '';
      return setNotice({ type: 'error', text: 'Cover image must be under 5MB.' });
    }
    setNotice(null);
    setCover(file);
    setPreview(file ? URL.createObjectURL(file) : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    const number = Number(form.episode_number);
    if (!Number.isInteger(number) || number < 1) {
      return setNotice({ type: 'error', text: 'Episode number must be a whole number, 1 or higher.' });
    }
    if (episodes.some((ep) => Number(ep.episode_number) === number)) {
      return setNotice({ type: 'error', text: `Episode ${number} already exists.` });
    }
    if (!YOUTUBE_URL.test(form.youtube_url.trim())) {
      return setNotice({ type: 'error', text: 'Enter a valid YouTube link (youtube.com/watch?v=… or youtu.be/…).' });
    }
    if (!cover) {
      return setNotice({ type: 'error', text: 'Add a cover image.' });
    }
    if (!CLOUDINARY_READY) {
      return setNotice({ type: 'error', text: 'Image uploads are not configured yet (see the Cloudinary note above).' });
    }

    try {
      let coverUrl;
      if (uploadedRef.current?.file === cover) {
        coverUrl = uploadedRef.current.url; // already uploaded on a previous attempt
      } else {
        setPhase('Uploading image…');
        coverUrl = await uploadToCloudinary(cover);
        uploadedRef.current = { file: cover, url: coverUrl };
      }

      setPhase('Saving episode…');
      await api.adminCreateEpisode({
        ...form,
        episode_number: number,
        youtube_url: form.youtube_url.trim(),
        cover_image_url: coverUrl,
      });

      setNotice({ type: 'success', text: `Episode ${number} added.` });
      setForm(EMPTY);
      setCover(null);
      setPreview('');
      setFileKey((k) => k + 1);
      uploadedRef.current = null;
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setPhase('');
    }
  }

  async function handleDelete(episode) {
    if (!window.confirm(`Delete episode ${episode.episode_number} (${episode.title})? This cannot be undone.`)) return;
    setNotice(null);
    try {
      await api.adminDeleteEpisode(episode.id);
      setNotice({ type: 'success', text: `Episode ${episode.episode_number} deleted.` });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  return (
    <AdminLayout>
      <div className="container" style={{ padding: '40px 0 60px' }}>
        <h1 style={{ margin: '0 0 6px' }}>Episodes</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Episodes aren't hosted here each one links out to its YouTube video.
        </p>

        <form className="form" onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Add an episode</h2>

          {!CLOUDINARY_READY && (
            <Notice
              notice={{
                type: 'error',
                text: 'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to the frontend .env, then restart the dev server.',
              }}
            />
          )}

          <div style={fieldGrid}>
            <label>Episode number<input className="input" name="episode_number" type="number" min="1" value={form.episode_number} onChange={update} required /></label>
            <label>Publish date<input className="input" name="publish_date" type="date" value={form.publish_date} onChange={update} required /></label>
            <label>Guest<input className="input" name="guest_name" value={form.guest_name} onChange={update} maxLength={150} required /></label>
            <label>Category<input className="input" name="category" value={form.category} onChange={update} maxLength={60} placeholder="e.g. Music, Business" required /></label>
          </div>
          <label>Title<input className="input" name="title" value={form.title} onChange={update} maxLength={200} required /></label>
          <label>YouTube link<input className="input" name="youtube_url" type="url" value={form.youtube_url} onChange={update} placeholder="https://www.youtube.com/watch?v=…" required /></label>

          <div>
            <label>
              Cover image (JPG, PNG or WEBP, max 5MB — 16:9 works best)
              <input key={fileKey} className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} />
            </label>
            {preview && (
              <img
                src={preview}
                alt="Cover preview"
                style={{ marginTop: 10, width: 240, aspectRatio: '16 / 9', objectFit: 'cover', border: '1px solid var(--line)', display: 'block' }}
              />
            )}
          </div>

          <label>Description<textarea className="input textarea" name="description" value={form.description} onChange={update} maxLength={1000} required /></label>
          <Notice notice={notice} />
          <div>
            <button className="button" type="submit" disabled={saving || !CLOUDINARY_READY}>
              {saving ? phase : 'Add episode'}
            </button>
          </div>
        </form>

        <h2 style={{ margin: '44px 0 0', fontSize: 22 }}>All episodes ({episodes.length})</h2>
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!loading && episodes.length === 0 && <p style={{ color: 'var(--muted)' }}>No episodes yet.</p>}
        {episodes.map((ep) => (
          <div
            key={ep.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--line)', padding: '14px 0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {ep.cover_image_url ? (
                <img src={thumb(ep.cover_image_url)} alt="" style={{ width: 96, aspectRatio: '16 / 9', objectFit: 'cover', border: '1px solid var(--line)' }} />
              ) : (
                <span style={{ width: 96, aspectRatio: '16 / 9', border: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)' }}>No cover</span>
              )}
              <div>
                <strong>Episode {ep.episode_number}</strong> · {ep.guest_name}
                <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  {ep.title} · {ep.category}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a className="filter" href={ep.youtube_url} target="_blank" rel="noreferrer">Watch</a>
              <button className="filter" style={{ color: '#b3261e', borderColor: '#b3261e' }} onClick={() => handleDelete(ep)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
