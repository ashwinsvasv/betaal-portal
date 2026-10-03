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
