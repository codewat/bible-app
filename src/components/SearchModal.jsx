import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Loader2, Filter } from 'lucide-react';

export default function SearchModal({
  isOpen,
  onClose,
  currentBookId,
  currentBookName,
  onNavigateToVerse
}) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ALL'); // 'ALL' | 'OT' | 'NT' | 'CURRENT'
  const [searchIndex, setSearchIndex] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Lazy load search index when modal opens
  useEffect(() => {
    if (isOpen && !searchIndex && !loadingIndex) {
      setLoadingIndex(true);
      fetch('/data/search-index.json')
        .then(res => res.json())
        .then(data => {
          setSearchIndex(data);
          setLoadingIndex(false);
        })
        .catch(err => {
          console.error('Failed to load search index:', err);
          setLoadingIndex(false);
        });
    }
  }, [isOpen, searchIndex, loadingIndex]);

  // Execute search when query or scope changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !searchIndex) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const q = query.toLowerCase().trim();
    setHasSearched(true);

    const filtered = [];
    for (let i = 0; i < searchIndex.length; i++) {
      const v = searchIndex[i];

      // Scope filter
      if (scope === 'CURRENT' && v.b !== currentBookId) continue;
      // OT vs NT check: OT is books 0..45, NT is 46..72 or we can inspect testament if mapped
      // But we can check testament or index
      if (scope === 'OT' && i >= 27570) continue; // NT starts after 2 Maccabees (~27570 verses in Douay OT)
      if (scope === 'NT' && i < 27570) continue;

      if (v.t.toLowerCase().includes(q)) {
        filtered.push(v);
        if (filtered.length >= 100) break; // Limit to top 100 for fast UI performance
      }
    }

    setResults(filtered);
  }, [query, scope, searchIndex, currentBookId]);

  if (!isOpen) return null;

  const highlightMatch = (text, term) => {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 dark:bg-amber-700/70 text-inherit rounded-xs px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSelectVerse = (v) => {
    onNavigateToVerse(v.b, v.c, v.v);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1a1917] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Search Catholic Scripture</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words (e.g. grace, love, mercy, faith, kingdom)..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scope Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 flex items-center mr-1">
              <Filter className="w-3 h-3 mr-1" /> Scope:
            </span>
            <button
              onClick={() => setScope('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'ALL'
                  ? 'bg-amber-700 text-white font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              All 73 Books
            </button>
            <button
              onClick={() => setScope('OT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'OT'
                  ? 'bg-amber-700 text-white font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              Old Testament
            </button>
            <button
              onClick={() => setScope('NT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'NT'
                  ? 'bg-amber-700 text-white font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              New Testament
            </button>
            <button
              onClick={() => setScope('CURRENT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'CURRENT'
                  ? 'bg-amber-700 text-white font-medium'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              This Book ({currentBookName})
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingIndex && (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <span className="text-xs">Preparing 35,000+ Catholic verses...</span>
            </div>
          )}

          {!loadingIndex && hasSearched && results.length === 0 && (
            <div className="py-12 text-center text-sm text-neutral-500">
              No verses found for "{query}". Try checking the spelling or broader terms.
            </div>
          )}

          {!loadingIndex && !hasSearched && (
            <div className="py-12 text-center text-sm text-neutral-400">
              Type at least 2 characters to search across the entire Catholic Douay-Rheims Bible.
            </div>
          )}

          {results.map((v, i) => (
            <button
              key={`${v.b}-${v.c}-${v.v}-${i}`}
              onClick={() => handleSelectVerse(v)}
              className="w-full text-left p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-amber-50 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 hover:border-amber-300 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  {v.bn} {v.c}:{v.v}
                </span>
                <span className="text-[11px] text-neutral-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 flex items-center">
                  Read <ChevronRight className="w-3 h-3 ml-0.5 inline" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed line-clamp-2">
                {highlightMatch(v.t, query)}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        {hasSearched && results.length > 0 && (
          <div className="px-5 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-xs text-neutral-500 flex justify-between">
            <span>Showing top {results.length} matches</span>
            <span>Click any result to open chapter</span>
          </div>
        )}
      </div>
    </div>
  );
}

