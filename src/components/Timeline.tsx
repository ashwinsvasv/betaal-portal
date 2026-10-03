'use client';

import React from 'react';
import { StatusUpdate } from '@/types';
import { useSunwai } from '@/lib/store';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  XCircle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface Props {
  updates: StatusUpdate[];
}

export function Timeline({ updates }: Props) {
  const { getUserById, getUserRole } = useSunwai();

  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const getStatusIcon = (toStatus: string) => {
    switch (toStatus) {
      case 'Raised':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Acknowledged':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'In Progress':
        return <PlayCircle className="w-4 h-4 text-indigo-600" />;
      case 'Completed':
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case 'Escalated L1':
      case 'Escalated L2':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'Closed':
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
      case 'Withdrawn':
        return <RotateCcw className="w-4 h-4 text-zinc-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStepBg = (toStatus: string) => {
    switch (toStatus) {
      case 'Raised':
        return 'bg-amber-100 border-amber-300';
      case 'Acknowledged':
        return 'bg-blue-100 border-blue-300';
      case 'In Progress':
        return 'bg-indigo-100 border-indigo-300';
      case 'Completed':
        return 'bg-emerald-100 border-emerald-300';
      case 'Escalated L1':
      case 'Escalated L2':
        return 'bg-rose-100 border-rose-300 animate-pulse';
      case 'Rejected':
        return 'bg-rose-100 border-rose-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sortedUpdates.map((update, idx) => {
        const actor = update.actor_id === 'system' ? null : getUserById(update.actor_id);
        const actorRole = actor ? getUserRole(actor.id) : null;

        return (
          <div key={update.id || idx} className="relative group">
            {/* Step marker icon */}
            <div
              className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center bg-white shadow-sm z-10 ${getStepBg(
                update.to_status
              )}`}
            >
              {getStatusIcon(update.to_status)}
            </div>

            {/* Event box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:bg-white transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {update.from_status === update.to_status
                      ? `Update: ${update.to_status}`
                      : `${update.from_status} → ${update.to_status}`}
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full font-medium bg-slate-200 text-slate-700">
                    {update.actor_id === 'system'
                      ? 'System Job'
                      : actorRole?.name || actor?.name || 'Student'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(update.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {/* Note */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
                {update.note}
              </p>

              {/* Optional Photo Attachment */}
              {update.photo_url && (
                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Resolution Proof Attached:
                  </div>
                  <img
                    src={update.photo_url}
                    alt="Update proof"
                    className="w-full max-w-xs h-36 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
