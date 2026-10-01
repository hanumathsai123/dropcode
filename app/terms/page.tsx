import Link from 'next/link';

export const metadata = {
  title: 'Terms | DropCodes',
  description: 'Terms for using the DropCodes file and text sharing service.',
};

export default function Terms() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">Drop<span>Codes</span></Link>
        <Link href="/">Home</Link>
      </nav>
      <article className="page card legal-page">
        <h1>Terms of Use</h1>
        <p className="muted">Last updated: October 1, 2026</p>
        <p>
          By using DropCodes, you agree to use the service lawfully and follow
          these terms.
        </p>
        <h2>Your content</h2>
        <p>
          You are responsible for the text and files you share and for having the
          rights and permission to share them. Do not upload unlawful, harmful,
          or infringing content, or use DropCodes to violate another person&apos;s
          rights.
        </p>
        <h2>Share codes and availability</h2>
        <p>
          Anyone with a share code may access its content. Keep codes private if
          you do not want others to access a share. Shares are subject to the
          expiry and access limits shown when they are created. The service is
          provided as available and may change or be interrupted.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not attempt to disrupt, probe, or gain unauthorized access to the
          service or other users&apos; shares. We may restrict access to protect
          the service or respond to abuse.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent through the
          {' '}<Link href="/support">support page</Link>.
        </p>
      </article>
    </main>
  );
}