'use client';

import React from 'react';
import { useSunwai } from '@/lib/store';
import { Mail, X, CheckCircle, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailOutboxModal({ isOpen, onClose }: Props) {
  const { outbox } = useSunwai();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Simulated Email Outbox</h2>
              <p className="text-xs text-slate-500">
                Sprint 1 on-screen log of notifications sent to role inboxes and students
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {outbox.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Mail className="w-12 h-12 mx-auto stroke-[1.2] mb-2 opacity-50" />
              <p>No emails dispatched yet.</p>
            </div>
          ) : (
            outbox.map((email) => (
              <div
                key={email.id}
                className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      To: {email.recipient}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {email.template}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(email.sent_at || email.created_at).toLocaleTimeString('en-IN')}</span>
                    {email.status === 'sent' ? (
                      <span className="flex items-center text-emerald-600 font-medium ml-1">
                        <CheckCircle className="w-3.5 h-3.5 mr-0.5" /> Sent
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-600 font-medium ml-1">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1">{email.subject}</h4>
                <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">
                  {email.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Total notifications: {outbox.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
