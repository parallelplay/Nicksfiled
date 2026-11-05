import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nickfield AI — Cinema Studio | AI Video Suite',
  description: 'Create cinematic AI videos with character consistency, props tracking, and ByteDance Seedance 2.5.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0d0e] text-[#ededed] antialiased selection:bg-yellow-400/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
