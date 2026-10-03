import type { Metadata } from 'next';
import './globals.css';
import { SunwaiProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Sunwai — Student Council Issue Portal | IIM Lucknow',
  description:
    'Sunwai gives every student complaint at IIM Lucknow an owner, a deadline and a public status, so no issue can be silently ignored.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <SunwaiProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">Sunwai (सुनवाई)</span>
                <span>— Student Council Issue Portal</span>
              </div>
              <div className="text-slate-400">
                Indian Institute of Management Lucknow · Overtures Sprint 1 MVP
              </div>
            </div>
          </footer>
        </SunwaiProvider>
      </body>
    </html>
  );
}
