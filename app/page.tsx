import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import OrganisationOffer from "@/components/OrganisationOffer";
import PartnerWithCodeDrop from "@/components/PartnerWithCodeDrop";
import SponsorBanner from "@/components/SponsorBanner";
import SupportCodeDrop from "@/components/SupportCodeDrop";
import TransferWorkspace from "@/components/TransferWorkspace";
import { getMonetizationConfig } from "@/lib/monetization";

export default function Home() {
  const monetization = getMonetizationConfig();

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          Drop<span>Codes</span>
        </Link>
        <div className="navlinks">
          <a href="#features">Features</a>
          <Link href="/support">Support</Link>
          <Link href="/access">Enter Code</Link>
        </div>
      </nav>
      <section className="hero">
        <div className="eyebrow">PRIVATE FILE AND TEXT SHARING</div>
        <h1>
          Share files &amp; text.
          <br />
          Instantly across devices.
        </h1>
        <p>
          Send a note, code snippet, or document with a simple access code. No
          account needed.
        </p>
        <div className="hero-points" aria-label="Sharing benefits">
          <span>No account required</span>
          <span>Automatic expiry</span>
          <span>Code-based access</span>
        </div>
      </section>
      <TransferWorkspace />
      <section className="features-section" id="features">
        <div className="section-heading">
          <div className="eyebrow">MADE FOR QUICK, SIMPLE SHARING</div>
          <h2>Everything you need. Nothing to install.</h2>
          <p>DropCodes keeps sharing straightforward from the first click to the last view.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-item">
            <span className="feature-number">01</span>
            <h3>Works across devices</h3>
            <p>Open a share from any modern browser with its access code.</p>
          </article>
          <article className="feature-item">
            <span className="feature-number">02</span>
            <h3>Choose an expiry</h3>
            <p>Set a time limit and view or download limit for each share.</p>
          </article>
          <article className="feature-item">
            <span className="feature-number">03</span>
            <h3>No app or account</h3>
            <p>Create and receive shares directly in your browser.</p>
          </article>
          <article className="feature-item">
            <span className="feature-number">04</span>
            <h3>Text and files</h3>
            <p>Send a short message, code snippet, or document with one flow.</p>
          </article>
        </div>
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
        DropCodes · Simple, code-based sharing.
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
        </div>
      </footer>
    </main>
  );
}
