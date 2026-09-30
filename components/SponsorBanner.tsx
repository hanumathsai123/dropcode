type SponsorBannerProps = {
  name: string;
  url: string;
  message: string;
};

export default function SponsorBanner({
  name,
  url,
  message,
}: SponsorBannerProps) {
  if (!name || !url) return null;

  return (
    <section className="monetization-panel sponsor-panel">
      <span className="monetization-label">Sponsored</span>
      <h2>Supported by {name}</h2>
      {message && <p>{message}</p>}
      <a className="text-link" href={url} target="_blank" rel="sponsored nofollow noopener noreferrer">
        Visit sponsor <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}