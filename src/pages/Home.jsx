import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EpisodeCard } from '../components/EpisodeCard.jsx';
import { SectionHeading } from '../components/PageParts.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { useCart } from '../lib/CartContext.jsx';
import { api } from '../lib/api';
import { assets, shows } from '../siteData.js';

// Same status → color mapping as My Orders, so an order's state reads the
// same wherever it shows up on the site.
const STATUS = {
  pending_payment: { label: 'Awaiting payment verification', color: '#9a7b1f' },
  approved: { label: 'Approved', color: '#2e7d32' },
  rejected: { label: 'Rejected', color: '#b3261e' },
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// Logged-in visitors get a personal top strip (greeting, most relevant
// action, a glance at their latest order) instead of the generic pitch a
// first-time visitor sees. Everything below the hero — episodes, shows,
// merch teaser — stays identical for everyone.
function AccountStrip() {
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState(null);
  const [pendingAdminCount, setPendingAdminCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    api
      .myOrders()
      .then((d) => setLatestOrder(d.orders?.[0] ?? null))
      .catch(() => setLatestOrder(null));

    if (user.role === 'admin') {
      api
        .adminOrders('pending_payment')
        .then((d) => setPendingAdminCount(d.orders?.length ?? 0))
        .catch(() => setPendingAdminCount(null));
    }
  }, [user]);

  if (!user) return null;

  const status = latestOrder ? STATUS[latestOrder.status] : null;

  return (
    <section className="section" style={{ paddingTop: 0, paddingBottom: 30 }}>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px dashed var(--line)',
          padding: '16px 20px',
        }}
      >
        <div>
          {latestOrder ? (
            <p style={{ margin: 0 }}>
              Your last order <strong>{latestOrder.order_ref}</strong> is{' '}
              <strong style={{ color: status?.color }}>{status?.label || latestOrder.status}</strong>.{' '}
              <Link className="episode-link" to="/orders" style={{ display: 'inline' }}>
                View orders
              </Link>
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--muted)' }}>No orders yet.</p>
          )}
        </div>
        {user.role === 'admin' && pendingAdminCount !== null && (
          <p style={{ margin: 0 }}>
            <Link className="episode-link" to="/admin">
              {pendingAdminCount} order{pendingAdminCount === 1 ? '' : 's'} awaiting your review
            </Link>
          </p>
        )}
      </motion.div>
    </section>
  );
}

export default function Home() {
  const { user, ready } = useAuth();
  const { count: cartCount } = useCart();
  const [hasOrderNeedingProof, setHasOrderNeedingProof] = useState(false);
  const [episodes, setEpisodes] = useState(null); // null = loading

  useEffect(() => {
    api
      .episodes()
      .then((d) => setEpisodes(d.episodes))
      .catch(() => setEpisodes([]));
  }, []);

  const [featured, ...rest] = episodes || [];

  useEffect(() => {
    if (!user) {
      setHasOrderNeedingProof(false);
      return;
    }
    api
      .myOrders()
      .then((d) =>
        setHasOrderNeedingProof(
          (d.orders || []).some((order) => order.status === 'pending_payment' && !Number(order.has_proof))
        )
      )
      .catch(() => setHasOrderNeedingProof(false));
  }, [user]);

  const firstName = user?.full_name?.split(' ')[0];

  // Priority: finish a pending order > continue an active cart > default pitch.
  let secondaryCta = { label: 'Shop the merch', to: '/store', outline: true };
  if (ready && user && hasOrderNeedingProof) {
    secondaryCta = { label: 'Finish your order', to: '/orders', outline: false };
  } else if (ready && cartCount > 0) {
    secondaryCta = { label: 'Continue to checkout', to: '/store', outline: false };
  }

  return (
    <>
      <section className="hero">
        <img src={assets.hero} alt="Kingsley Mudau hosting a conversation" />
        <div className="container hero-content">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="eyebrow" style={{ color: 'var(--signal)' }}>
              {ready && user ? `Welcome back, ${firstName}` : 'Est. 2023 · Venda, South Africa'}
            </p>
            {/* The brand heading stays constant regardless of login state 
                the greeting already lives in the eyebrow line above, so
                repeating it here would both duplicate it and bury the
                brand name on every return visit. */}
            <h1>
              The Black
              <br />
              Couch Network
            </h1>
            <p className="hero-copy">
              A virtual living room for conversations, culture, entertainment, success stories and social
              commentary hosted by Kingsley Mudau.
            </p>
            <div className="actions">
              <Link className="button" to="/episodes">
                Watch episodes <Play size={16} />
              </Link>
              <Link className={`button ${secondaryCta.outline ? 'outline' : ''}`} to={secondaryCta.to}>
                {secondaryCta.label}
              </Link>
            </div>
            {ready && !user && (
              <p style={{ marginTop: 14, fontSize: 14 }}>
                Already have an account?{' '}
                <Link className="episode-link" to="/login" style={{ display: 'inline' }}>
                  Log in
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <AccountStrip />

      {featured && (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="Latest conversation" title="Now on the couch" />
            <div style={{ marginTop: 30 }}>
              <EpisodeCard episode={featured} featured />
            </div>
          </div>
        </section>
      )}

      <section className="section muted">
        <div className="container">
          <SectionHeading
            eyebrow="The network"
            title="Our shows"
            action={
              <Link className="episode-link" to="/shows">
                All shows <ArrowUpRight size={15} />
              </Link>
            }
          />
          <motion.div className="grid three" style={{ marginTop: 30 }} variants={gridVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            {shows.map((show) => (
              <motion.article className="show-card" key={show.name} variants={cardVariants}>
                <img src={show.image} alt={show.name} loading="lazy" decoding="async" />
                <div className="show-card-body">
                  <h3>{show.name}</h3>
                  <p className="eyebrow">{show.strapline}</p>
                  <p>{show.description}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {episodes === null ? (
        <section className="section">
          <div className="container">
            <p style={{ color: 'var(--muted)' }}>Loading episodes…</p>
          </div>
        </section>
      ) : episodes.length === 0 ? (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="Recent" title="Latest episodes" />
            <p style={{ marginTop: 20, color: 'var(--muted)' }}>
              New episodes are on the way check back soon.
            </p>
          </div>
        </section>
      ) : (
        rest.length > 0 && (
          <section className="section">
            <div className="container">
              <SectionHeading
                eyebrow="Recent"
                title="Latest episodes"
                action={
                  <Link className="episode-link" to="/episodes">
                    See all <ArrowUpRight size={15} />
                  </Link>
                }
              />
              <motion.div className="grid three" style={{ marginTop: 30 }} variants={gridVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
                {rest.slice(0, 6).map((episode) => (
                  <motion.div key={episode.id} variants={cardVariants}>
                    <EpisodeCard episode={episode} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )
      )}

      <section className="section dark">
        <div className="container split">
          <div>
            <p className="eyebrow">Merch</p>
            <h2 style={{ fontSize: 'clamp(60px, 8vw, 110px)', lineHeight: 0.82 }}>Wear the couch.</h2>
            <p className="hero-copy">
              Official tees, hoodies and accessories. Check out with proof of payment Kingsley verifies
              every order by hand.
            </p>
            <Link className="button" to="/store" style={{ marginTop: 25 }}>
              Browse the store
            </Link>
          </div>
          <div className="grid two">
            <img src={assets.merch} alt="Black Couch merchandise" loading="lazy" decoding="async" />
            <img src={assets.hoodie} alt="Black Couch hoodie" loading="lazy" decoding="async" />
          </div>
        </div>
      </section>
    </>
  );
}
