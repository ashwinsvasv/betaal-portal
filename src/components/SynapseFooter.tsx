'use client';

import React from 'react';
import Link from 'next/link';

export function SynapseFooter() {
  return (
    <footer className="w-full mt-12 pb-8 px-4 sm:px-6">
      <div className="max-w-[1050px] mx-auto space-y-4">
        {/* Top White Card: Team Synapse attribution & institutional info */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Team Synapse Brand */}
          <div className="flex items-center gap-4">
            {/* Synapse Atom / Orbit Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0f172a] text-white flex items-center justify-center p-2 shadow-sm shrink-0">
                <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                  {/* Neural / Atomic Orbit structure */}
                  <ellipse cx="24" cy="24" rx="20" ry="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" transform="rotate(-30 24 24)" className="text-[#38bdf8]" />
                  <ellipse cx="24" cy="24" rx="20" ry="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" transform="rotate(30 24 24)" className="text-[#818cf8]" />
                  <ellipse cx="24" cy="24" rx="20" ry="7.5" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" transform="rotate(90 24 24)" className="text-[#f43f5e]" />
                  <circle cx="24" cy="24" r="5.5" fill="#38bdf8" />
                  <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
                  <circle cx="10" cy="16" r="2" fill="#818cf8" />
                  <circle cx="38" cy="32" r="2" fill="#f43f5e" />
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">MADE WITH</span>
                  <span className="text-red-500 text-xs">♥</span>
                  <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">BY</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[17px] font-black tracking-tight text-gray-900 font-sans">
                    Team Synaps<span className="font-extrabold text-[#2563eb]">E</span>
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                    IIM LUCKNOW
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Divider for Desktop */}
          <div className="hidden md:block w-px h-10 bg-gray-200" />

          {/* Right: Portal purpose & mandatory safety disclaimer (No member names) */}
          <div className="flex-1 text-center md:text-left text-xs text-gray-500 leading-relaxed max-w-xl">
            <p className="font-medium text-gray-700">
              Sunwai — Official Student Grievance & Accountability Portal
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Complaints regarding harassment, ragging, or emergency safety must be reported directly to the Internal Complaints Committee (ICC) or Campus Security.
            </p>
          </div>
        </div>

        {/* Bottom Black Bar: Portal Breadcrumbs + Social Links */}
        <div className="bg-[#0f172a] text-white rounded-xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          {/* Synapse Portals List */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[12px] font-medium text-gray-300">
            <span className="hover:text-white transition-colors cursor-pointer">Etrigan</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Diagon Alley</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Calvin</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Hodor</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Aghanim</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Dumbledore</span>
            <span className="text-gray-600">|</span>
            <span className="hover:text-white transition-colors cursor-pointer">Stex</span>
            <span className="text-gray-600">|</span>
            <span className="text-[#38bdf8] font-bold">Sunwai</span>
          </div>

          {/* Social Links: LinkedIn & Instagram */}
          <div className="flex items-center gap-2.5">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/synapse-iim-lucknow/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Team Synapse LinkedIn"
              className="w-7 h-7 rounded-md bg-[#0A66C2] hover:bg-[#004182] flex items-center justify-center text-white transition-colors shadow-xs"
              title="Team Synapse on LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/synapse_iiml/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Team Synapse Instagram"
              className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 flex items-center justify-center text-white transition-opacity shadow-xs"
              title="Team Synapse on Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
