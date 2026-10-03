'use client';

import React, { useState } from 'react';
import { useSunwai } from '@/lib/store';
import { createEmailItem } from '@/lib/email-service';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Filter,
  RefreshCw,
  Send,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function OutboxPage() {
  const { outbox, retryFailedEmails, triggerDailyDigest } = useSunwai();

  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredOutbox = outbox.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const failedCount = outbox.filter((i) => i.status === 'failed').length;
  const sentCount = outbox.filter((i) => i.status === 'sent').length;

  const handleRetryAll = () => {
    const retried = retryFailedEmails();
    setNotification(`Outbox worker executed: ${retried} failed email(s) retried with exponential backoff.`);
  };

  const handleGenerateDailyDigest = () => {
    const count = triggerDailyDigest();
    setNotification(`8:00 AM Daily Digest compiled: ${count} emails queued and dispatched to role inboxes.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Email Dispatch Service (Sprint 2 S10)
              </span>
              <span className="text-xs text-slate-300">Resend / SMTP Outbox Queue with 3x Retries</span>
            </div>
            <h1 className="text-2xl font-black">Outbox & Notification Center</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Audit log of all notifications dispatched to role inboxes, students, President, and Student Affairs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {failedCount > 0 && (
              <button
                onClick={handleRetryAll}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Retry Failed ({failedCount})
              </button>
            )}
            <button
              onClick={handleGenerateDailyDigest}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" /> Send 8 AM Daily Digest
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Dispatched</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{outbox.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Delivered Successfully</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{sentCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Delivery Failures</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{failedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Max Auto-Retries</div>
            <div className="text-2xl font-black text-purple-600 mt-0.5">3 Attempts</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Notifications ({outbox.length})
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'sent'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sent ({sentCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredOutbox.length} entries
          </span>
        </div>

        {filteredOutbox.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No emails match the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOutbox.map((email) => (
              <div
                key={email.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        email.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                    >
                      {email.status}
                    </span>
                    <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      To: {email.recipient}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Template: {email.template}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Attempt #{email.attempts}/3
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{email.subject}</h3>

                  {email.error_message && (
                    <div className="text-rose-600 text-[11px] font-mono">
                      Error: {email.error_message}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(email.sent_at || email.created_at).toLocaleTimeString('en-IN')}
                  </span>
                  <button
                    onClick={() => setSelectedEmail(email)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Body
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Body Modal Preview */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Email Message Preview</h3>
                <span className="text-xs text-slate-500 font-mono">To: {selectedEmail.recipient}</span>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-xs text-slate-800">
                Subject: {selectedEmail.subject}
              </div>
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
                {selectedEmail.body}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
