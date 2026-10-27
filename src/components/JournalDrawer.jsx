import React, { useState } from 'react';
import { 
  X, Bookmark, Highlighter, MessageSquare, Trash2, 
  ChevronRight, Download, BookOpen, Heart 
} from 'lucide-react';

export default function JournalDrawer({
  isOpen,
  onClose,
  bookmarks,
  highlights,
  notes,
  onRemoveBookmark,
  onRemoveHighlight,
  onDeleteNote,
  onNavigateToVerse
}) {
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'notes' | 'highlights'

  if (!isOpen) return null;

  const bookmarkList = Object.values(bookmarks);
  const noteList = Object.values(notes);
  const highlightList = Object.values(highlights);

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      bookmarks: bookmarkList,
      notes: noteList,
      highlights: highlightList
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catholic-bible-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-[#1a1917] h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-neutral-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              My Saved & Reflections
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleExportData}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              title="Backup / Export Journal to JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 text-xs font-medium">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'bookmarks'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Bookmarks ({bookmarkList.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'notes'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Reflections & Notes ({noteList.length})
          </button>
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              activeTab === 'highlights'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Highlights ({highlightList.length})
          </button>
        </div>

        {/* Tab contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'bookmarks' && (
            bookmarkList.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No bookmarks yet. Click any verse or combine multiple verses to save them!
              </div>
            ) : (
              bookmarkList.map((bm) => {
                const firstVerse = bm.verseNumbers?.[0] || bm.verse || 1;
                const rangeLabel = bm.verseRange || bm.verse;
                return (
                  <div
                    key={bm.id || `${bm.bookId}:${bm.chapter}:${rangeLabel}`}
                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30 hover:border-amber-300 dark:hover:border-amber-700/60 transition group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          onNavigateToVerse(bm.bookId, bm.chapter, firstVerse);
                          onClose();
                        }}
                        className="font-serif font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300 hover:underline flex items-center"
                      >
                        <span>{bm.bookName} {bm.chapter}:{rangeLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1 inline text-neutral-400" />
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(bm)}
                        className="text-neutral-400 hover:text-rose-500 p-1 rounded transition"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Feelings chips if any */}
                    {bm.feelings && bm.feelings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {bm.feelings.map((f, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40"
                          >
                            <span>{f.emoji}</span>
                            <span>{f.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note if any */}
                    {bm.note && (
                      <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-neutral-800/60 border-l-2 border-amber-600 text-xs font-sans text-neutral-800 dark:text-neutral-200">
                        <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-0.5">
                          Reflection:
                        </span>
                        {bm.note}
                      </div>
                    )}

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-serif line-clamp-3 italic">
                      "{bm.text}"
                    </p>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'notes' && (
            noteList.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No reflection notes saved yet.
              </div>
            ) : (
              noteList.map((n, idx) => {
                const noteKey = n.id || `${n.bookId}:${n.chapter}:${n.verseRange || n.verse}`;
                const firstVerse = n.verse || 1;
                return (
                  <div
                    key={noteKey || idx}
                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30 hover:border-amber-300 dark:hover:border-amber-700/60 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          onNavigateToVerse(n.bookId, n.chapter, firstVerse);
                          onClose();
                        }}
                        className="font-serif font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300 hover:underline flex items-center"
                      >
                        <span>{n.bookName} {n.chapter}:{n.verseRange || n.verse}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1 inline text-neutral-400" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(noteKey)}
                        className="text-neutral-400 hover:text-rose-500 p-1 rounded transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Feelings chips if any */}
                    {n.feelings && n.feelings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {n.feelings.map((f, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40"
                          >
                            <span>{f.emoji}</span>
                            <span>{f.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-neutral-800/60 text-xs font-sans text-neutral-800 dark:text-neutral-200 font-medium">
                      {n.text}
                    </div>

                    <p className="text-[11px] text-neutral-400 italic line-clamp-2">
                      "{n.verseText || n.text}"
                    </p>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'highlights' && (
            highlightList.length === 0 ? (
              <div className="py-16 text-center text-sm text-neutral-400">
                <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No highlighted verses yet.
              </div>
            ) : (
              highlightList.map((h) => (
                <div
                  key={`${h.bookId}:${h.chapter}:${h.verse}`}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30 flex items-center justify-between"
                >
                  <button
                    onClick={() => {
                      onNavigateToVerse(h.bookId, h.chapter, h.verse);
                      onClose();
                    }}
                    className="flex items-center space-x-2 text-left hover:underline"
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-${h.color}-400 shrink-0`} />
                    <span className="font-serif font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                      {h.bookId} {h.chapter}:{h.verse}
                    </span>
                  </button>
                  <button
                    onClick={() => onRemoveHighlight(h.bookId, h.chapter, h.verse)}
                    className="text-neutral-400 hover:text-rose-500 p-1 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
