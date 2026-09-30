import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import OrganisationOffer from "@/components/OrganisationOffer";
import PartnerWithCodeDrop from "@/components/PartnerWithCodeDrop";
import SponsorBanner from "@/components/SponsorBanner";
import SupportCodeDrop from "@/components/SupportCodeDrop";
import { getMonetizationConfig } from "@/lib/monetization";

export default function Home() {
  const monetization = getMonetizationConfig();

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Code<span>Drop</span>
        </Link>
        <div className="navlinks">
          <Link href="/support">Support</Link>
          <Link href="/access">Enter Code</Link>
        </div>
      </nav>
      <section className="hero">
        <div className="eyebrow">
          NO ACCOUNT • NO SIGN-IN • CODE-BASED SHARING
        </div>
        <h1>
          Share anything.
          <br />
          Just use a code.
        </h1>
        <p>
          Share text, source code and documents instantly. Create a share, get a
          code, and give it to the person who needs access.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/share/text">
            Share Text / Code
          </Link>
          <Link className="btn secondary" href="/share/document">
            Share a Document
          </Link>
        </div>
      </section>
      <section className="grid">
        <div className="card">
          <h2>Share Text / Code</h2>
          <p>
            Paste notes, source code, credentials, snippets or any text and
            generate a temporary share code.
          </p>
          <Link className="btn secondary" href="/share/text">
            Create Text Share →
          </Link>
        </div>
        <div className="card">
          <h2>Share a Document</h2>
          <p>
            Upload a document and let the recipient access it using the same
            simple code flow.
          </p>
          <Link className="btn secondary" href="/share/document">
            Upload Document →
          </Link>
        </div>
      </section>
      <section className="card" style={{ marginTop: 18, textAlign: "center" }}>
        <h2>Have a Share Code?</h2>
        <p>Enter the code you received. No account is required.</p>
        <Link className="btn" href="/access">
          Enter Share Code
        </Link>
      </section>
      <section className="monetization-grid" aria-label="Support and partnerships">
        {monetization.sponsor.enabled && (
          <SponsorBanner
            name={monetization.sponsor.name}
            url={monetization.sponsor.url}
            message={monetization.sponsor.message}
          />
        )}
        <SupportCodeDrop url={monetization.supportUrl} />
        <AffiliateRecommendations tools={monetization.affiliates} />
        <PartnerWithCodeDrop email={monetization.partnershipEmail} />
      </section>
      <OrganisationOffer email={monetization.partnershipEmail} />
      {monetization.ads.configured && (
        <AdBanner
          enabled={monetization.ads.configured}
          client={monetization.ads.client}
          slot={monetization.ads.slot}
        />
      )}
      <footer className="footer">
        CodeDrop · Simple. Private. Code-based sharing.
      </footer>
    </main>
  );
}
