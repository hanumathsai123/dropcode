import './globals.css';
import './monetization.css';
import './dropcode.css';
import type { Metadata } from 'next';
import LaunchAnnouncement from '@/components/LaunchAnnouncement';
import { getSiteUrl } from '@/lib/site';

const metadataBase = getSiteUrl();

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
			<body>
				<LaunchAnnouncement />
				{children}
			</body>
		</html>
	);
}
