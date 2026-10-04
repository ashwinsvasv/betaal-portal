'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error to monitoring service
    console.error('Unhandled Betaal runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white border border-[#dde2ea] rounded-[12px] p-8 sm:p-10 max-w-[540px] w-full text-center space-y-4">
        <h1 className="text-[26px] font-serif text-[#16213e] leading-snug">
          Something interrupted this action
        </h1>
        <p className="text-[15px] text-[#5b6478] leading-relaxed">
          {error.message || 'An unexpected problem occurred while loading this page.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2f45c5] hover:bg-[#2638a2] text-white text-[14px] font-medium rounded-[8px] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#dde2ea] text-[#16213e] hover:bg-[#f4f6f9] text-[14px] font-medium rounded-[8px] transition-colors text-center"
          >
            Return to all issues
          </Link>
        </div>
      </div>
    </div>
  );
}
