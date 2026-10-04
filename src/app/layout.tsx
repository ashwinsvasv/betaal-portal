import type { Metadata } from 'next';
import './globals.css';
import { SunwaiProvider } from '@/lib/store';
import { Header } from '@/components/Header';
import { Providers } from '@/components/Providers';
import { AuthSync } from '@/components/AuthSync';
import { SynapseFooter } from '@/components/SynapseFooter';

export const metadata: Metadata = {
  title: 'Betaal 1.0 — Student Council Issue Portal | IIM Lucknow',
  description:
    'Betaal keeps the Student Council accountable. Raise an issue, and it goes to the person whose job it is to fix it.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Rozha+One&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.png" />
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
