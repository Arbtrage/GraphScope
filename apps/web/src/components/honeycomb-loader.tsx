export function HoneycombLoader({ className }: { className?: string }) {
  return (
    <div className={className} role="status" aria-label="Loading">
      <div className="honeycomb">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}
