import React, { useRef, useEffect, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Bookmark, MessageSquare, 
  Sparkles, Volume2, Check, Copy, X, Plus 
} from 'lucide-react';

export default function BibleReader({
  bookMeta,
  chapter,
  chapterVerses,
  bookmarks,
  highlights,
  notes,
  currentVerseSpeaking,
  selectedVerses,
  onToggleVerseSelect,
  onClearSelection,
  onOpenSaveBookmarkModal,
  onPrevChapter,
  onNextChapter,
  fontSize,
  fontFamily,
  hasPrev,
  hasNext,
  onPlaySelectedVerses
}) {
  const speakingRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll to verse speaking
  useEffect(() => {
    if (currentVerseSpeaking && speakingRef.current) {
      speakingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentVerseSpeaking]);

  if (!bookMeta || !chapterVerses) {
    return (
      <div className="py-24 text-center text-neutral-400 font-serif">
        Loading Catholic Holy Scripture...
      </div>
    );
  }

  // Check if verse is selected
  const isVerseSelected = (vNum) => {
    return selectedVerses.some(v => v.verse === vNum);
  };

  // Format selection citation (e.g. "Matthew 5:3-5" or "Matthew 5:3, 5")
  const sortedSelected = [...selectedVerses].sort((a, b) => a.verse - b.verse);
  let selectionCitation = '';
  if (sortedSelected.length > 0) {
    const isConsecutive = sortedSelected.every((v, idx) => idx === 0 || v.verse === sortedSelected[idx - 1].verse + 1);
    const range = isConsecutive && sortedSelected.length > 1
      ? `${sortedSelected[0].verse}–${sortedSelected[sortedSelected.length - 1].verse}`
      : sortedSelected.map(v => v.verse).join(', ');
    selectionCitation = `${bookMeta.modernName} ${chapter}:${range}`;
  }

  const handleCopySelected = () => {
    if (sortedSelected.length === 0) return;
    const textToCopy = `"${sortedSelected.map(v => `[${v.verse}] ${v.text}`).join(' ')}" — ${selectionCitation} (Douay-Rheims Catholic Bible)`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find bookmark data that belongs to a specific verse
  const getBookmarkForVerse = (vNum) => {
    for (const b of Object.values(bookmarks)) {
      if (b.bookId === bookMeta.id && Number(b.chapter) === Number(chapter)) {
        if (b.verseNumbers && b.verseNumbers.includes(vNum)) return b;
        if (Number(b.verse) === vNum) return b;
      }
    }
    return null;
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-36 relative">
      {/* Chapter Title & Header */}
      <div className="text-center mb-8 pb-6 border-b border-amber-900/10 dark:border-amber-500/10">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            {bookMeta.testament === 'OT' ? 'Old Testament' : 'New Testament'}
          </span>
          {bookMeta.deuterocanonical && (
            <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 mr-1 inline" />
              Catholic Canon
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          {bookMeta.modernName}
        </h1>

        <div className="text-lg sm:text-xl font-serif text-amber-800 dark:text-amber-400 font-medium">
          Chapter {chapter}
        </div>

        {bookMeta.name !== bookMeta.modernName && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">
            Douay-Rheims traditional title: {bookMeta.name}
          </p>
        )}

        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
          Tip: Click any verse (or multiple verses) to combine and save to bookmark
        </p>
      </div>

      {/* Verses Container */}
      <div 
        className={`leading-relaxed space-y-2.5 ${
          fontFamily === 'sans' ? 'font-sans' : fontFamily === 'book' ? 'font-book' : 'font-serif'
        } ${fontSize}`}
      >
        {chapterVerses.map((v) => {
          const vKey = `${bookMeta.id}:${chapter}:${v.verse}`;
          const isSelected = isVerseSelected(v.verse);
          const bm = getBookmarkForVerse(v.verse);
          const isBm = Boolean(bm);
          const hl = highlights[vKey]?.color;
          const note = notes[vKey]?.text || bm?.note;
          const feelings = bm?.feelings || [];
          const isSpeaking = currentVerseSpeaking && currentVerseSpeaking.verse === v.verse;

          let highlightClass = '';
          if (hl === 'yellow') highlightClass = 'verse-highlight-yellow';
          else if (hl === 'green') highlightClass = 'verse-highlight-green';
          else if (hl === 'blue') highlightClass = 'verse-highlight-blue';
          else if (hl === 'pink') highlightClass = 'verse-highlight-pink';
          else if (hl === 'purple') highlightClass = 'verse-highlight-purple';

          return (
            <div
              key={v.verse}
              ref={isSpeaking ? speakingRef : null}
              onClick={() => onToggleVerseSelect(v)}
              className={`group relative p-2.5 sm:p-3 -mx-2 rounded-xl cursor-pointer transition-all select-none ${highlightClass} ${
                isSelected 
                  ? 'ring-2 ring-amber-600 dark:ring-amber-400 bg-amber-500/15 dark:bg-amber-400/15 shadow-sm' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              } ${isSpeaking ? 'verse-speaking' : ''}`}
            >
              {/* Verse Text with Number */}
              <div className="flex items-baseline space-x-2.5 text-neutral-900 dark:text-neutral-100">
                <span className={`inline-flex items-center justify-center font-mono text-xs font-bold rounded px-1.5 py-0.5 transition shrink-0 ${
                  isSelected 
                    ? 'bg-amber-700 text-white shadow-xs' 
                    : 'text-amber-800 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 group-hover:bg-amber-200'
                }`}>
                  {isSelected ? <Check className="w-3 h-3" /> : v.verse}
                </span>

                <span className="flex-1">
                  {v.text}
                </span>

                {/* Indicators: Bookmark, Note */}
                <div className="flex items-center space-x-1 shrink-0 ml-1">
                  {isBm && (
                    <Bookmark className="w-3.5 h-3.5 fill-amber-600 text-amber-600" title="Bookmarked" />
                  )}
                  {note && (
                    <MessageSquare className="w-3.5 h-3.5 fill-amber-500/30 text-amber-700 dark:text-amber-300" title="Has Reflection Note" />
                  )}
                </div>
              </div>

              {/* Feelings badges if saved in bookmark */}
              {feelings.length > 0 && (
                <div className="mt-2 ml-7 flex flex-wrap gap-1">
                  {feelings.map((f, fIdx) => (
                    <span 
                      key={fIdx}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100/80 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-300/40"
                    >
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Note preview if any */}
              {note && (
                <div className="mt-2 ml-7 p-2 rounded-lg bg-amber-50/80 dark:bg-neutral-800/60 border-l-2 border-amber-600 text-xs font-sans text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-0.5">
                    Personal Reflection:
                  </span>
                  {note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chapter Bottom Navigation (Prev / Next) */}
      <div className="mt-12 pt-6 border-t border-amber-900/10 dark:border-amber-500/10 flex items-center justify-between">
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border transition ${
            hasPrev
              ? 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              : 'border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Previous Chapter</span>
        </button>

        <span className="text-xs text-neutral-400 font-mono">
          {bookMeta.modernName} {chapter} of {bookMeta.chapterCount}
        </span>

        <button
          onClick={onNextChapter}
          disabled={!hasNext}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border transition ${
            hasNext
              ? 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              : 'border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          }`}
        >
          <span className="text-sm font-medium">Next Chapter</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* FLOATING SIDE ACTION DOCK (Appears when verses are clicked/selected) */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-6 right-4 sm:right-8 z-40 animate-slideUp">
          <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-amber-500/30 p-2 sm:p-2.5 flex items-center space-x-2">
            {/* Selection Info */}
            <div className="px-2.5 py-1 text-left border-r border-neutral-700 mr-1 max-w-[150px] sm:max-w-[200px] truncate">
              <p className="font-serif font-bold text-xs sm:text-sm text-amber-300 truncate">
                {selectionCitation}
              </p>
              <p className="text-[10px] text-neutral-400">
                {selectedVerses.length} {selectedVerses.length === 1 ? 'verse selected' : 'verses combined'}
              </p>
            </div>

            {/* Primary Action: Save to Bookmark */}
            <button
              onClick={onOpenSaveBookmarkModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md transition transform active:scale-95"
              title="Save selected verses to bookmarks"
            >
              <Bookmark className="w-4 h-4 fill-white" />
              <span>Save to Bookmark</span>
            </button>

            {/* Listen button */}
            <button
              onClick={() => onPlaySelectedVerses(sortedSelected)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title="Listen to selected verses"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopySelected}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title="Copy combined text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Deselect / Cancel button */}
            <button
              onClick={onClearSelection}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              title="Cancel selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
