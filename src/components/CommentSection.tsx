'use client';

import React, { useState } from 'react';
import { Comment } from '@/types';
import { useSunwai } from '@/lib/store';
import { Send, Shield, User as UserIcon, MessageSquare } from 'lucide-react';

interface Props {
  issueId: string;
}

export function CommentSection({ issueId }: Props) {
  const { comments, addComment, currentUser, getUserById, getUserRole } = useSunwai();
  const [commentText, setCommentText] = useState('');

  const issueComments = comments.filter((c) => c.issue_id === issueId);
  const currentUserRole = getUserRole(currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment(issueId, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Discussion ({issueComments.length})</span>
        </h3>
        <span className="text-xs text-slate-400">
          Council member comments show their official role
        </span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Comment as ${
              currentUserRole ? `${currentUserRole.name} (${currentUser.name})` : `${currentUser.course} ${currentUser.batch} Student`
            }...`}
            className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            Keep feedback constructive and respectful.
          </span>
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-3 pt-2">
        {issueComments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No comments yet. Join the conversation!
          </div>
        ) : (
          issueComments.map((comment) => {
            const author = getUserById(comment.author_id);
            const authorRole = author ? getUserRole(author.id) : null;
            const isCouncil = Boolean(authorRole);

            // Public Identity Rule:
            // Students see only course & batch; Council members show their official role!
            const authorTitle = isCouncil
              ? `${authorRole?.name}`
              : `${author?.course || 'PGP'} ${author?.batch || 'Batch'} student`;

            return (
              <div
                key={comment.id}
                className={`p-3.5 rounded-lg border text-xs sm:text-sm transition-colors ${
                  isCouncil
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCouncil
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isCouncil ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {authorTitle}
                      </span>
                      {isCouncil && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded border border-blue-300">
                          Council Officer
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(comment.created_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <p className="text-slate-700 whitespace-pre-line leading-relaxed pl-8">
                  {comment.removed_by_admin ? (
                    <span className="italic text-slate-400">
                      [Comment removed by admin: {comment.removal_reason || 'Policy violation'}]
                    </span>
                  ) : (
                    comment.body
                  )}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
