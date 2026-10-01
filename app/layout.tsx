import './globals.css';
import './monetization.css';
import './dropcode.css';
import type { Metadata } from 'next';

const deploymentHost =
	process.env.NEXT_PUBLIC_SITE_URL ||
	process.env.VERCEL_PROJECT_PRODUCTION_URL ||
	process.env.VERCEL_URL;
const metadataBase = deploymentHost
	? new URL(deploymentHost.startsWith('http') ? deploymentHost : `https://${deploymentHost}`)
	: undefined;

export const metadata: Metadata = {
	metadataBase,
	title: 'DropCodes | Share Files and Text With a Code',
	description:
		'Share text, code snippets, and documents with a simple access code. No account required.',
	applicationName: 'DropCodes',
	openGraph: {
		title: 'DropCodes | Share Files and Text With a Code',
		description:
			'Share text, code snippets, and documents with a simple access code. No account required.',
		siteName: 'DropCodes',
		type: 'website',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
