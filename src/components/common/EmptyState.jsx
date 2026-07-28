export default function EmptyState({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
      <p className="state-message state-message--muted" style={{ margin: 0 }}>{label}</p>
    </div>
  );
}
