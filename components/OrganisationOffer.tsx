import Link from "next/link";

type OrganisationOfferProps = { email: string };

export default function OrganisationOffer({ email }: OrganisationOfferProps) {
  const subject = encodeURIComponent("Private DropCode for an organisation");

  return (
    <section className="organisation-panel">
      <div>
        <span className="monetization-label">For organisations</span>
        <h2>Need a private, branded DropCode?</h2>
        <p>
          Organisations can ask about a separately deployed instance. The public
          DropCode product remains free for everyone.
        </p>
      </div>
      {email ? (
        <a className="btn secondary" href={`mailto:${email}?subject=${subject}`}>
          Discuss an organisation deployment
        </a>
      ) : (
        <Link className="btn secondary" href="/support">
          Contact DropCode
        </Link>
      )}
    </section>
  );
}