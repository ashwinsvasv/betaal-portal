'use client';

import React, { useState } from 'react';
import { useSunwai } from '@/lib/store';
import { User, CouncilRole } from '@/types';
import { Users, X, Shield, Check, School, UserCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonaSwitcherModal({ isOpen, onClose }: Props) {
  const { currentUser, setCurrentUser, users, roles } = useSunwai();
  const [customEmail, setCustomEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  if (!isOpen) return null;

  // Key predefined personas for evaluation & testing
  const personas = [
    {
      user: users.find((u) => u.roll_no === 'PGP41001') || users[11], // Rahul Sharma (Student)
      label: 'Student (Hostel 3)',
      desc: 'Can raise, vote, comment, and confirm/reopen issues',
      role: 'Student',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      user: users.find((u) => u.roll_no === 'PGP41030') || users[8], // Vikramaditya Rao
      label: 'Hostel Rep H3 (Vikramaditya)',
      desc: 'Owns single-hostel issues in H3 (e.g. Hot Water geysers)',
      role: 'Hostel Rep H3',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      user: users.find((u) => u.roll_no === 'PGP40012') || users[1], // Kabir Mehta
      label: 'Infra & IT Secretary (Kabir)',
      desc: 'Owns campus infra & copied on all hostel infra tickets',
      role: 'Infra & IT Sec',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      user: users.find((u) => u.roll_no === 'PGP40045') || users[2], // Ananya Sen
      label: 'Mess Secretary (Ananya)',
      desc: 'Owns all mess, food quality, and night canteen issues',
      role: 'Mess Sec',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      user: users.find((u) => u.roll_no === 'PGP40001') || users[0], // Ashwin Narayan
      label: 'President (Ashwin Narayan)',
      desc: 'Resolves escalations, conflict of interest, and campus overview',
      role: 'President',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      user: users.find((u) => u.roll_no === 'PGP40099') || users[10], // Tech Admin
      label: 'Tech Admin',
      desc: 'System maintenance, audit logs, student roll prefixes',
      role: 'Admin',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    },
  ];

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!customEmail.trim().endsWith('@iiml.ac.in')) {
      setEmailError('Authentication policy: Only @iiml.ac.in Google accounts are permitted.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === customEmail.trim().toLowerCase()
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      onClose();
    } else {
      setEmailError('Student not found in enrolled student database. Contact council admin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Switch Persona / Test Role</h2>
              <p className="text-xs text-slate-500">
                Experience Sunwai through different roles across the issue lifecycle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Select a Role to Impersonate:
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {personas.map((p) => {
              const isSelected = currentUser.id === p.user.id;
              return (
                <button
                  key={p.user.id}
                  onClick={() => {
                    setCurrentUser(p.user);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 uppercase">
                      {p.user.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {p.user.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.badgeColor}`}
                        >
                          {p.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.user.roll_no} · {p.user.course} Batch {p.user.batch} · {p.user.hostel}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Test Google Auth with @iiml.ac.in */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Or Test Sign-In with any @iiml.ac.in Account:
            </div>
            <form onSubmit={handleCustomLogin} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. rahul.s@iiml.ac.in or priya.n@iiml.ac.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" /> Sign In
                </button>
              </div>
              {emailError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Active user: <strong className="text-slate-800">{currentUser.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
