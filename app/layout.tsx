import './globals.css';
import './monetization.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'CodeDrop — Share anything with a code',description:'Account-free text and document sharing with a share code.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
