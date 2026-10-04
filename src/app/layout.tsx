import type { Metadata } from 'next';
import './globals.css';
import { SunwaiProvider } from '@/lib/store';
import { Header } from '@/components/Header';
import { Providers } from '@/components/Providers';
import { AuthSync } from '@/components/AuthSync';
import { SynapseFooter } from '@/components/SynapseFooter';

export const metadata: Metadata = {
  title: 'Sunwai — Student Council Issue Portal | IIM Lucknow',
  description:
    'Every student complaint at IIM Lucknow has an owner and a deadline.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f4f6f9] text-[#16213e] font-sans antialiased">
        <Providers>
          <SunwaiProvider>
            <AuthSync />
            <Header />
            <main className="flex-1 max-w-[1050px] w-full mx-auto px-4 sm:px-6 py-8">
              {children}
            </main>
            <SynapseFooter />
          </SunwaiProvider>
        </Providers>
      </body>
    </html>
  );
}
