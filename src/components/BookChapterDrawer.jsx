import React, { useState } from 'react';
import { X, Search, ChevronRight, Book, Sparkles } from 'lucide-react';

export default function BookChapterDrawer({
  isOpen,
  onClose,
  booksMeta,
  currentBookId,
  currentChapter,
  onSelectBookChapter
}) {
  const [selectedTestament, setSelectedTestament] = useState('ALL'); // 'ALL' | 'OT' | 'NT'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBook, setActiveBook] = useState(null);

  if (!isOpen) return null;

  // Filter books
  const filteredBooks = booksMeta.filter(b => {
    if (selectedTestament !== 'ALL' && b.testament !== selectedTestament) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.modernName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayedBook = activeBook || booksMeta.find(b => b.id === currentBookId) || booksMeta[0];

  const handleSelectChapter = (ch) => {
    onSelectBookChapter(displayedBook.id, ch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#1a1917] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-2">
            <Book className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100">
              Select Book & Chapter
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-medium">
              Catholic 73 Books
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Testament Filter Tabs */}
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books (e.g. Matthew, Wisdom, Sirach)..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>

          {/* Testament switcher */}
          <div className="flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl text-xs font-medium w-full sm:w-auto justify-center">
            <button
              onClick={() => setSelectedTestament('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTestament === 'ALL'
                  ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              All (73)
            </button>
            <button
              onClick={() => setSelectedTestament('OT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTestament === 'OT'
                  ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Old Testament (46)
            </button>
            <button
              onClick={() => setSelectedTestament('NT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTestament === 'NT'
                  ? 'bg-white dark:bg-neutral-700 text-amber-900 dark:text-amber-200 shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              New Testament (27)
            </button>
          </div>
        </div>

        {/* Content: 2-column on desktop (Left: Books list, Right: Chapters grid) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-12">
          {/* Books List (5 cols on sm+) */}
          <div className="sm:col-span-6 md:col-span-5 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto p-3 space-y-1">
            {filteredBooks.map((b) => {
              const isSelected = displayedBook && displayedBook.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBook(b)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold border border-amber-300 dark:border-amber-700/50'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="truncate text-sm">
                        {b.modernName}
                      </span>
                      {b.deuterocanonical && (
                        <span 
                          className="shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300" 
                          title="Deuterocanonical Catholic Book"
                        >
                          Catholic
                        </span>
                      )}
                    </div>
                    {b.name !== b.modernName && (
                      <p className="text-[11px] text-neutral-400 truncate">
                        Douay: {b.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neutral-400 shrink-0">
                    <span>{b.chapterCount} ch</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}

            {filteredBooks.length === 0 && (
              <div className="py-8 text-center text-sm text-neutral-400">
                No books match "{searchQuery}"
              </div>
            )}
          </div>

          {/* Chapters Grid (7 cols on sm+) */}
          <div className="sm:col-span-6 md:col-span-7 overflow-y-auto p-4 sm:p-6 bg-neutral-50/50 dark:bg-neutral-900/10">
            {displayedBook && (
              <div>
                <div className="mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                      {displayedBook.modernName}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                      {displayedBook.testament === 'OT' ? 'Old Testament' : 'New Testament'} • {displayedBook.category}
                    </span>
                  </div>
                  {displayedBook.deuterocanonical && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 inline" />
                      <span>Catholic Deuterocanonical book (canonized in Church Councils)</span>
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Select a chapter to begin reading:
                  </p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2">
                  {Array.from({ length: displayedBook.chapterCount }, (_, i) => i + 1).map((ch) => {
                    const isCurrent = displayedBook.id === currentBookId && ch === Number(currentChapter);
                    return (
                      <button
                        key={ch}
                        onClick={() => handleSelectChapter(ch)}
                        className={`py-3 rounded-xl text-sm font-semibold transition active:scale-95 ${
                          isCurrent
                            ? 'bg-amber-700 text-white shadow-md ring-2 ring-amber-400 dark:ring-amber-500'
                            : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-amber-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:border-amber-300'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

