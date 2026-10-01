type SupportCodeDropProps = { url: string };

export default function SupportCodeDrop({ url }: SupportCodeDropProps) {
  return (
    <section className="monetization-panel">
      <span className="monetization-label">Optional</span>
      <h2>Support DropCodes</h2>
      <p>
        The DropCodes sharing service is free for everyone. If you find it useful,
        you can support its continued development.
      </p>
      {url ? (
        <a className="btn secondary" href={url} target="_blank" rel="noopener noreferrer">
          Support DropCodes
        </a>
      ) : (
        <span className="muted">Support link coming soon.</span>
      )}
    </section>
  );
}