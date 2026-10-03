// Small shared bits for the admin content pages.

export function Notice({ notice }) {
  if (!notice) return null;
  const color = notice.type === 'error' ? '#b3261e' : '#2e7d32';
  return (
    <p role={notice.type === 'error' ? 'alert' : 'status'} style={{ margin: '16px 0', padding: '10px 14px', border: `1px solid ${color}`, color }}>
      {notice.text}
    </p>
  );
}

export const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
};

export const cardStyle = { border: '1px solid var(--line)', padding: 22, marginTop: 24 };
