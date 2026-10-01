import Link from 'next/link';

export const metadata = {
  title: 'Privacy | DropCodes',
  description: 'How DropCodes handles shared content, support requests, and advertising.',
};

export default function Privacy() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">Drop<span>Codes</span></Link>
        <Link href="/">Home</Link>
      </nav>
      <article className="page card legal-page">
        <h1>Privacy</h1>
        <p className="muted">Last updated: October 1, 2026</p>
        <p>
          DropCodes lets people share text and files using access codes. This page
          describes the information handled when you use the service.
        </p>
        <h2>Information you submit</h2>
        <p>
          Shared text, uploaded files, share codes, file details, expiry settings,
          and access counts are stored to operate each share. Anyone with a valid
          share code may access its content. DropCodes support administrators may
          also access stored shares when responding to recovery requests.
        </p>
        <p>
          If you contact support, we store the email address, share code if
          provided, and the reason you submit. These details are used to respond
          to the request.
        </p>
        <h2>Service providers</h2>
        <p>
          DropCodes uses Supabase to store shares and files, and may use Resend to
          deliver support emails. These providers process information to provide
          their services.
        </p>
        <h2>Advertising</h2>
        <p>
          If advertising is enabled, Google AdSense may use cookies or similar
          technologies to deliver and measure ads, subject to your choice in the
          ad consent prompt and Google&apos;s policies. You can change your choice
          by clearing this site&apos;s browser storage. Advertising may not be
          available until DropCodes is approved by Google.
        </p>
        <h2>Retention and choices</h2>
        <p>
          Shares have expiry and access limits selected at creation. Support
          records may be kept as needed to handle requests and operate the
          service. For a privacy request, contact us through the
          {' '}<Link href="/support">support page</Link>.
        </p>
        <p>
          Questions about this policy can be sent through the
          {' '}<Link href="/support">support page</Link>.
        </p>
      </article>
    </main>
  );
}