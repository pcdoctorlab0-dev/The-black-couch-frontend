import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { EpisodeCard } from './components/EpisodeCard.jsx';
import { PageIntro } from './components/PageParts.jsx';
import RouteLoader from './components/RouteLoader.jsx';
import { CartProvider, useCart } from './lib/CartContext.jsx';
import { useAuth } from './lib/AuthContext.jsx';
import { api } from './lib/api';
import Home from './pages/Home.jsx';
import HowToOrder from './pages/HowToOrder.jsx';
import NotFound from './pages/NotFound.jsx';
import { assets, shows, socialLinks } from './siteData.js';
import './styles.css';

// Code-split everything heavier than a static marketing page: auth forms,
// account pages, the store (pulls in framer-motion-heavy cart UI), and the
// whole admin area. A first-time customer visiting Home or Episodes never
// downloads any of this — it loads on demand, right when it's needed.
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const MyOrders = lazy(() => import('./pages/MyOrders.jsx'));
const Store = lazy(() => import('./pages/Store.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminEpisodes = lazy(() => import('./pages/admin/AdminEpisodes.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading">Loading your session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading">Loading your session...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Header() {
  const { user, ready, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = [['Episodes', '/episodes'], ['Shows', '/shows'], ['Guests', '/guests'], ['Store', '/store'], ['About', '/about'], ['Contact', '/contact']];
  return <header className="site-header">
    <div className="container header-inner">
      <Link to="/" className="brand"><span className="brand-mark"><img src={assets.logo} alt="The Black Couch logo" /></span><span>The Black Couch</span></Link>
      <nav className="nav" aria-label="Primary navigation">{links.map(([label, path]) => <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>{label}</Link>)}</nav>
      <div className="header-actions">
        <Link className="icon-button" to="/episodes" aria-label="Search episodes"><Search size={19} /></Link>
        {ready && user && <Link className="icon-button" to="/store" aria-label={`Cart with ${cartCount} items`} style={{ position: 'relative' }}><ShoppingBag size={19} />{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</Link>}
        {ready && !user && <Link className="header-login-link" to="/login">Log in</Link>}
        <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {open && <nav className="mobile-menu" aria-label="Mobile navigation">
      {user && <div className="mobile-menu-account"><strong>{user.full_name}</strong><span>{user.role === 'admin' ? 'Admin' : 'Customer'}</span></div>}
      {links.map(([label, path]) => <Link key={path} to={path} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} /></Link>)}
      {user ? <>
        <Link to="/profile" onClick={() => setOpen(false)}>Profile<ArrowUpRight size={16} /></Link>
        <Link to="/orders" onClick={() => setOpen(false)}>My orders<ArrowUpRight size={16} /></Link>
        {user.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)}>Admin<ArrowUpRight size={16} /></Link>}
      </> : <Link to="/login" onClick={() => setOpen(false)}>Log in<ArrowUpRight size={16} /></Link>}
    </nav>}
    {ready && user && <div className="session-bar">Signed in as {user.full_name} - <Link to="/orders">My orders</Link>{user.role === 'admin' && <> - <Link to="/admin">Admin</Link></>} - <button onClick={logout}>Log out</button></div>}
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-grid"><div><p className="eyebrow">Home of local entertainment</p><p className="footer-title">Come sit on<br />the couch.</p></div><div className="footer-links"><div><p>Explore</p>{['Episodes', 'Shows', 'Guests', 'Store', 'About', 'Contact'].map((item) => <Link key={item} to={`/${item.toLowerCase()}`}>{item}</Link>)}<Link to="/how-to-order">How ordering works</Link></div><div><p>Listen & follow</p>{socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>)}</div></div></div><div className="footer-bottom"><span>© 2026 The Black Couch Network</span><span>Established 2023 · Led by Kingsley Mudau</span></div></div></footer>;
}

function MobileDock() { return <nav className="mobile-dock"><Link to="/"><span>Home</span></Link><Link to="/episodes"><span>Episodes</span></Link><Link to="/store"><span>Store</span></Link><Link to="/about"><span>More</span></Link></nav>; }

function EpisodesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [episodes, setEpisodes] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.episodes()
      .then((data) => setEpisodes(data.episodes))
      .catch((error) => {
        setLoadError(error.message);
        setEpisodes([]);
      });
  }, []);

  const loadedEpisodes = episodes ?? [];
  const categories = ['All', ...new Set(loadedEpisodes.map((episode) => episode.category))];
  const results = loadedEpisodes.filter((episode) =>
    (category === 'All' || episode.category === category)
    && `${episode.episode_number} ${episode.guest_name} ${episode.title} ${episode.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return <>
    <PageIntro kicker="The archive" title="Episodes" copy="Every conversation from the couch. Search by guest or topic, filter by category, and watch the full episode on YouTube." />
    <section className="section">
      <div className="container">
        <div className="toolbar"><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guests, topics or episode numbers" aria-label="Search episodes" /></div>
        <div className="toolbar">{categories.map((item) => <button className={`filter ${category === item ? 'active' : ''}`} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {episodes === null && <p role="status" style={{ color: 'var(--muted)' }}>Loading episodes…</p>}
        {loadError && <p role="alert">Could not load episodes: {loadError}</p>}
        {episodes !== null && !loadError && episodes.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No episodes yet check back soon.</p>
        )}
        {episodes !== null && !loadError && results.length > 0 && (
          <p style={{ color: 'var(--muted)' }}>{results.length} episode{results.length === 1 ? '' : 's'}</p>
        )}
        <div className="grid three" style={{ marginTop: 22 }}>
          {results.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)}
        </div>
      </div>
    </section>
  </>;
}
function ShowsPage() { return <><PageIntro kicker="The network" title="Shows" copy="Three programmes running from the same couch, each with its own tone and rhythm." /><section className="section"><div className="container grid">{shows.map((show, index) => <article className="split" key={show.name}><img src={show.image} alt={`${show.name} in the studio`} loading="lazy" decoding="async" /><div><p className="eyebrow">0{index + 1} · {show.strapline}</p><h2 style={{ fontSize: 'clamp(58px, 8vw, 110px)', lineHeight: .84, marginTop: 12 }}>{show.name}</h2><p className="prose">{show.description}</p></div></article>)}</div></section></>; }
function GuestsPage() {
  const [episodes, setEpisodes] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');

  useEffect(() => {
    api.episodes()
      .then((data) => setEpisodes(data.episodes))
      .catch((error) => {
        setLoadError(error.message);
        setEpisodes([]);
      });
  }, []);

  const filteredEpisodes = (episodes ?? [])
    .filter((episode) =>
      `${episode.guest_name} ${episode.episode_number} ${episode.title} ${episode.category} ${episode.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .sort((first, second) => {
      if (sort === 'date') {
        return second.publish_date.localeCompare(first.publish_date)
          || second.episode_number - first.episode_number;
      }
      if (sort === 'number') {
        return second.episode_number - first.episode_number;
      }
      return first.guest_name.localeCompare(second.guest_name)
        || second.episode_number - first.episode_number;
    });

  return <>
    <PageIntro kicker="Who sat down" title="Guests" copy="Browse every episode guest. Search by name or topic, then sort the archive your way." />
    <section className="section">
      <div className="container">
        <div className="toolbar">
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guests, episodes or topics"
            aria-label="Search guests"
          />
          <label>
            Sort by
            <select className="input" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort guests">
              <option value="name">Guest A–Z</option>
              <option value="date">Publish date</option>
              <option value="number">Episode number</option>
            </select>
          </label>
        </div>

        {episodes === null && <p role="status" style={{ color: 'var(--muted)' }}>Loading guests…</p>}
        {loadError && <p role="alert">Could not load guests: {loadError}</p>}
        {episodes !== null && !loadError && episodes.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No guest episodes yet check back soon.</p>
        )}
        {episodes?.length > 0 && filteredEpisodes.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No guests match your search.</p>
        )}
        {filteredEpisodes.length > 0 && (
          <>
            <p style={{ color: 'var(--muted)' }}>{filteredEpisodes.length} episode{filteredEpisodes.length === 1 ? '' : 's'}</p>
            <div className="grid three" style={{ marginTop: 22 }}>
              {filteredEpisodes.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)}
            </div>
          </>
        )}
      </div>
    </section>
  </>;
}
function AboutPage() { return <><PageIntro kicker="Since 2023" title="About" copy="The Black Couch Network is a virtual living room: a place for conversations, culture, entertainment, success stories and social commentary." /><section className="section"><div className="container split"><div className="prose"><p>Founded in 2023 and hosted by <strong>Kingsley Mudau</strong>, the network brings artists, entrepreneurs, public voices and local personalities onto the couch for relaxed, long-form conversation.</p><p>The interviews stay unhurried and open. Guests are given room to tell their story in their own words, whether the subject is music, business, family, loss or the issues shaping the community.</p><p>Rooted in Venda storytelling, the network's wider ambition is a media platform where local voices are documented properly and heard far beyond home.</p></div><img src={assets.studio} alt="Kingsley Mudau in conversation on the black couch" loading="lazy" decoding="async" /></div></section></>; }
function ContactPage() { const [sent, setSent] = useState(false); return <><PageIntro kicker="Say hello" title="Contact" copy="Booking, guest suggestions, sponsorship or merch questions start the conversation here." /><section className="section"><div className="container split"><form className="form" onSubmit={(event) => { event.preventDefault(); setSent(true); event.currentTarget.reset(); }}><label>Name<input className="input" required /></label><label>Email<input className="input" type="email" required /></label><label>Subject<input className="input" required /></label><label>Message<textarea className="input textarea" required /></label><button className="button" type="submit">Send message <ArrowUpRight size={16} /></button>{sent && <p role="status" style={{ color: 'var(--brick)' }}>Message captured. Connect an inbox and it will be delivered automatically.</p>}</form><div><h2 style={{ fontSize: 70, lineHeight: .85 }}>Work with<br />the couch.</h2><p className="prose">Guest bookings, brand partnerships and merch enquiries are all welcome. Include as much detail as you can so the team can respond quickly.</p></div></div></section></>; }

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Admin pages render their own AdminLayout (dark bar, Dashboard/Orders/
  // Episodes/Products nav, log out) instead of the public Header/Footer/
  // MobileDock — none of the store nav or cart icon is relevant to
  // Kingsley reviewing orders, and a visually distinct shell makes it
  // obvious this isn't a page a customer could land on. It still gets the
  // same page-transition treatment as the public site, via the same
  // AnimatePresence/motion.main pattern, so moving between admin pages
  // feels like part of the same product rather than a bolted-on panel.
  if (isAdminRoute) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
              <Route path="/admin/episodes" element={<RequireAdmin><AdminEpisodes /></RequireAdmin>} />
              <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    );
  }

  return <div className="shell"><Header /><AnimatePresence mode="wait"><motion.main key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}><Suspense fallback={<RouteLoader />}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/episodes" element={<EpisodesPage />} />
    <Route path="/shows" element={<ShowsPage />} />
    <Route path="/guests" element={<GuestsPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/how-to-order" element={<HowToOrder />} />
    <Route path="/store" element={<Store />} />
    <Route path="/cart" element={<Navigate to="/store" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
    <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></motion.main></AnimatePresence><Footer /><MobileDock /></div>;
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}
