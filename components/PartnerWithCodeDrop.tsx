type PartnerWithCodeDropProps = { email: string };

export default function PartnerWithCodeDrop({ email }: PartnerWithCodeDropProps) {
  return (
    <section className="monetization-panel">
      <span className="monetization-label">Business</span>
      <h2>Partner with DropCode</h2>
      <p>
        Get in touch about sponsorships, developer-tool or college partnerships,
        and business collaborations.
      </p>
      {email ? (
        <a
          className="text-link"
          href={`mailto:${email}?subject=DropCode%20partnership`}
        >
          {email}
        </a>
      ) : (
        <span className="muted">Partnership contact is not configured yet.</span>
      )}
    </section>
  );
}