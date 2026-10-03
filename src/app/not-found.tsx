import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white border border-[#dde2ea] rounded-[12px] p-8 sm:p-10 max-w-[540px] w-full text-center space-y-4">
        <h1 className="text-[26px] font-serif text-[#16213e] leading-snug">
          Page not found
        </h1>
        <p className="text-[15px] text-[#5b6478] leading-relaxed">
          The page or issue you are looking for does not exist, or you may not have permission to view it.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#2f45c5] hover:bg-[#2638a2] text-white text-[14px] font-medium rounded-[8px] transition-colors text-center"
          >
            Return to all issues
          </Link>
        </div>
      </div>
    </div>
  );
}
