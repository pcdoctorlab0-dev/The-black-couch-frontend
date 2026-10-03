import { Link } from 'react-router-dom';
import { PageIntro } from '../components/PageParts.jsx';

const STEPS = [
  {
    title: 'Add items to your bag',
    body: 'Browse the store and add whatever you want — no account needed yet.',
  },
  {
    title: 'Log in or create an account',
    body: "You'll be asked to log in when you check out. This is how we keep track of your order and let you upload proof of payment.",
  },
  {
    title: 'Check out and pay by EFT',
    body: 'Submit your order, then make an EFT/bank transfer for the total shown using the account details provided at checkout.',
  },
  {
    title: 'Upload your proof of payment',
    body: 'On the My Orders page, upload a screenshot or PDF of your payment confirmation for that order.',
  },
  {
    title: 'Kingsley verifies it',
    body: "Kingsley checks your proof against the account statement directly. This is a manual step, so it isn't instant — you'll see the order status update once it's reviewed.",
  },
  {
    title: "You're set",
    body: "Once approved, your order is confirmed and gets prepared for delivery. If it's rejected (for example, the payment can't be matched), any stock held for your order is released automatically, and you're welcome to re-order.",
  },
];

export default function HowToOrder() {
  return (
    <>
      <PageIntro
        kicker="Merch FAQ"
        title="How ordering works"
        copy="There's no card checkout yet — orders are confirmed by proof of payment instead. Here's exactly how that works, start to finish."
      />
      <section className="section">
        <div className="container">
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 26, maxWidth: 640 }}>
            {STEPS.map((step, index) => (
              <li key={step.title} style={{ display: 'flex', gap: 18 }}>
                <span style={{ fontSize: 14, color: 'var(--muted)', minWidth: 24 }}>0{index + 1}</span>
                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{step.title}</h3>
                  <p className="prose" style={{ margin: 0 }}>
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="prose" style={{ marginTop: 34 }}>
            Questions about an order? <Link to="/contact">Get in touch</Link> or check its status any time on{' '}
            <Link to="/orders">My Orders</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
