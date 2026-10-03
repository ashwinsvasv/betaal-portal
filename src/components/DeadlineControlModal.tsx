'use client';

import React, { useState } from 'react';
import { useSunwai } from '@/lib/store';
import {
  Clock,
  Zap,
  FastForward,
  AlertTriangle,
  CheckCircle2,
  Mail,
  RotateCcw,
  Sparkles,
  X,
  Play,
  FileText,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DeadlineControlModal({ isOpen, onClose }: Props) {
  const {
    runDeadlineChecker,
    triggerDailyDigest,
    lastCronReport,
    simulatedClockOffsetHours,
    setSimulatedClockOffsetHours,
    raiseIssue,
    roles,
  } = useSunwai();

  const [activeTab, setActiveTab] = useState<'simulate' | 'logs'>('simulate');
  const [testIssueCreated, setTestIssueCreated] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to spawn an unacknowledged test issue for exit test
  const handleSpawnTestIssue = () => {
    const messRole = roles.find((r) => r.name === 'Mess Secretary') || roles[2];
    const newIss = raiseIssue({
      title: `[Exit Test] Raw chicken served at dinner counter (Test #${Math.floor(Math.random() * 1000)})`,
      details: 'Test issue spawned specifically for verifying the Sprint 2 auto-escalation mechanism. Not acknowledged by owner.',
      category: 'Mess and food',
      scope: 'whole campus',
      hostel: 'Hostel 3',
      visibility: 'public',
      ownerRoleId: messRole.id,
      ccRoleIds: [],
      photos: [],
    });

    setTestIssueCreated(newIss.id);
    setNotification(`Test issue spawned: "${newIss.title}". Status: Raised (48h clock running).`);
  };

  const handleTimeTravel = (hoursToAdd: number) => {
    const newOffset = simulatedClockOffsetHours + hoursToAdd;
    setSimulatedClockOffsetHours(newOffset);
    const report = runDeadlineChecker(newOffset);

    setNotification(
      `Clock advanced by +${hoursToAdd}h (Total simulated offset: +${newOffset}h). Checker ran: ${report.escalatedL1Count} Escalated L1, ${report.escalatedL2Count} Escalated L2, ${report.remindersSent} Reminders.`
    );
  };

  const handleResetClock = () => {
    setSimulatedClockOffsetHours(0);
    const report = runDeadlineChecker(0);
    setNotification('Simulated clock reset to real-time. Checker evaluated live active issues.');
  };

  const handleDailyDigest = () => {
    const count = triggerDailyDigest();
    setNotification(`8:00 AM Daily Digest generated: ${count} digest emails dispatched to role inboxes.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-300">
              <Zap className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">Accountability & Escalation Simulator</h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/30 font-bold uppercase">
                  Sprint 2 Exit Test
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Hourly deadline checker, auto-escalations, 24h reminders, and daily digests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('simulate')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'simulate'
                ? 'border-amber-600 text-amber-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FastForward className="w-4 h-4" />
            <span>Time-Travel & Escalation Triggers</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-amber-600 text-amber-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Latest Cron Run Report</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'simulate' ? (
            <>
              {/* Status Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Simulated Time Offset:</span>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>
                      {simulatedClockOffsetHours === 0
                        ? 'Real-Time (0h offset)'
                        : `+${simulatedClockOffsetHours} Hours into the future`}
                    </span>
                  </div>
                </div>

                {simulatedClockOffsetHours > 0 && (
                  <button
                    onClick={handleResetClock}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset to Real-Time
                  </button>
                )}
              </div>

              {/* Step-by-Step Exit Test Walkthrough */}
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Sprint 2 Exit Test Verification Flow:</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The goal of Sprint 2 is to prove that <strong>an unacknowledged test issue escalates on its own</strong> without human intervention.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Step 1 */}
                  <div className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>Spawn Test Issue</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Creates a new unacknowledged mess complaint with a 48-hour response clock.
                    </p>
                    <button
                      onClick={handleSpawnTestIssue}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Spawn Unacknowledged Issue
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>Fast-Forward +24 Hours</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Advances clock by 24h. Triggers the automated 24-hour urgency reminder to owner.
                    </p>
                    <button
                      onClick={() => handleTimeTravel(24)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Fast-Forward 24 Hours
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>Fast-Forward +48h (Escalate L1)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Crosses the 48h SLA deadline. Issue automatically escalates to President (Level 1)!
                    </p>
                    <button
                      onClick={() => handleTimeTravel(48)}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Fast-Forward 48h (Trigger L1)
                    </button>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                      <span>Fast-Forward Another +48h (Escalate L2)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      President inattention window passed. Auto-escalates to Student Affairs (Level 2)!
                    </p>
                    <button
                      onClick={() => handleTimeTravel(48)}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Trigger L2 (Student Affairs)
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Cron Jobs: Daily Digest & 7-Day Auto Close */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>8:00 AM Daily Digest Job</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Compiles and dispatches daily summary of open, overdue, and priority tickets to each secretary.
                  </p>
                  <button
                    onClick={handleDailyDigest}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Generate Daily 8 AM Digest
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>7-Day Auto-Close & Update SLAs</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Advances clock by 7 days to test auto-closing of unobjected Completed tickets.
                  </p>
                  <button
                    onClick={() => handleTimeTravel(7 * 24)}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Fast-Forward 7 Days
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Logs Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Last Checker Run Timestamp:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lastCronReport ? new Date(lastCronReport.runAt).toLocaleString('en-IN') : 'Not run yet'}
                </span>
              </div>

              {lastCronReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <span className="text-slate-500 block">L1 Escalated</span>
                    <strong className="text-base text-rose-700">{lastCronReport.escalatedL1Count}</strong>
                  </div>
                  <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-slate-500 block">L2 Escalated</span>
                    <strong className="text-base text-purple-700">{lastCronReport.escalatedL2Count}</strong>
                  </div>
                  <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    <span className="text-slate-500 block">Reminders Sent</span>
                    <strong className="text-base text-blue-700">{lastCronReport.remindersSent}</strong>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Auto-Closed</span>
                    <strong className="text-base text-emerald-700">{lastCronReport.autoClosedCount}</strong>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Rule Evaluation Activity Log:
                </span>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs max-h-60 overflow-y-auto space-y-1.5">
                  {!lastCronReport || lastCronReport.logs.length === 0 ? (
                    <div className="text-slate-500">No log entries recorded. Run deadline check to view logs.</div>
                  ) : (
                    lastCronReport.logs.map((log, i) => (
                      <div key={i} className="leading-relaxed">
                        <span className="text-amber-400">›</span> {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Sprint 2 Exit Test Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
