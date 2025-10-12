// /app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from './components/AuthProvider'; // Import it

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Creator Commission Platform',
  description: 'Your affiliate marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider> {/* Wrap children */}
      </body>
    </html>
  );
}