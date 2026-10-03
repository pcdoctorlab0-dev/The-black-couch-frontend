import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <p className="eyebrow">404</p>
        <h1 className="page-title">This couch is empty.</h1>
        <p className="page-copy">The page you're looking for doesn't exist, or it moved.</p>
        <Link className="button" to="/" style={{ marginTop: 20, display: 'inline-flex' }}>
          Back to the couch
        </Link>
      </div>
    </section>
  );
}
