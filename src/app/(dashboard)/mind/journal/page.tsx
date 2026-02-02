'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const JOURNALING_COLOR = '#EC4899';

interface JournalEntry {
  id: string;
  entryType: string;
  mood: string | null;
  content: string;
  wordCount: number;
  createdAt: string;
  activityName: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  GRATITUDE: 'Gratitude',
  REFLECTION: 'Reflection',
  FREE_WRITE: 'Free Write',
  MORNING_PAGES: 'Morning Pages',
  EVENING_REVIEW: 'Evening Review',
};

const MOOD_EMOJIS: Record<string, string> = {
  GREAT: '😊',
  GOOD: '🙂',
  NEUTRAL: '😐',
  LOW: '😔',
  STRESSED: '😰',
};

function JournalPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-light rounded-lg" />
        <div className="h-8 w-48 bg-surface-light rounded" />
      </div>
      <div className="flex gap-2">
        <div className="w-32 h-10 bg-surface-light rounded-full" />
        <div className="w-32 h-10 bg-surface-light rounded-full" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-surface-light rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function JournalHistoryPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const fetchEntries = useCallback(
    async (page = 1, append = false) => {
      if (!token) return;

      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (selectedEntryType) {
          params.set('entryType', selectedEntryType);
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        const res = await fetch(`/api/v1/journal/entries?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (append) {
            setEntries((prev) => [...prev, ...data.data.entries]);
          } else {
            setEntries(data.data.entries);
          }
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error('Failed to fetch journal entries:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token, selectedEntryType, searchQuery]
  );

  useEffect(() => {
    fetchEntries(1, false);
  }, [fetchEntries]);

  const handleLoadMore = () => {
    if (pagination?.hasMore && !isLoadingMore) {
      fetchEntries(pagination.page + 1, true);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <JournalPageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => router.push('/mind')}
          className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: JOURNALING_COLOR }}>
            Journal History
          </h1>
          <p className="text-text-muted text-sm">
            {pagination?.total || 0} {pagination?.total === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      </motion.header>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search journal entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchEntries(1, false);
              }
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-surface-lighter text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
        </div>
      </motion.div>

      {/* Entry Type Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
      >
        <button
          onClick={() => setSelectedEntryType(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedEntryType === null
              ? 'text-white'
              : 'text-text-secondary bg-surface-light hover:bg-surface-lighter'
          }`}
          style={selectedEntryType === null ? { backgroundColor: JOURNALING_COLOR } : {}}
        >
          All Types
        </button>
        {Object.entries(ENTRY_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedEntryType(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedEntryType === key
                ? 'text-white'
                : 'text-text-secondary bg-surface-light hover:bg-surface-lighter'
            }`}
            style={selectedEntryType === key ? { backgroundColor: JOURNALING_COLOR } : {}}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Entries List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${JOURNALING_COLOR}15` }}
              >
                <svg className="w-8 h-8" fill="none" stroke={JOURNALING_COLOR} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-text-muted">No journal entries found</p>
              {(searchQuery || selectedEntryType) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEntryType(null);
                  }}
                  className="mt-2 text-sm text-pink-400 hover:text-pink-300"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${JOURNALING_COLOR}20`,
                              color: JOURNALING_COLOR,
                            }}
                          >
                            {ENTRY_TYPE_LABELS[entry.entryType] || entry.entryType}
                          </span>
                          {entry.mood && (
                            <span className="text-lg" title={entry.mood}>
                              {MOOD_EMOJIS[entry.mood] || ''}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-muted mb-2">
                          {formatDate(entry.createdAt)} at {formatTime(entry.createdAt)}
                        </div>
                        <p className="text-text-primary line-clamp-2">{entry.content}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-text-muted">{entry.wordCount} words</span>
                        <motion.div
                          animate={{ rotate: expandedEntry === entry.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg
                            className="w-5 h-5 text-text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedEntry === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/5 pt-4">
                          <p className="text-text-primary whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {pagination?.hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 rounded-xl bg-surface-light text-text-secondary hover:bg-surface-lighter transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              `Load More (${pagination.total - entries.length} remaining)`
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
