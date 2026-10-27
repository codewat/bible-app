import React, { useState, useEffect } from 'react';
import { X, Bookmark, Check, Palette, Sparkles, MessageSquare, Heart } from 'lucide-react';

const FEELING_OPTIONS = [
  { id: 'peaceful', label: 'Peaceful / Calm', emoji: '🕊️' },
  { id: 'inspired', label: 'Inspired / Uplifted', emoji: '✨' },
  { id: 'comforted', label: 'Comforted / Reassured', emoji: '🛡️' },
  { id: 'grateful', label: 'Grateful / Thankful', emoji: '🙏' },
  { id: 'loved', label: 'Loved by God', emoji: '💖' },
  { id: 'convicted', label: 'Convicted / Called to Change', emoji: '🔥' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { id: 'strengthened', label: 'Strengthened', emoji: '💪' },
  { id: 'healed', label: 'Healed / Restored', emoji: '🌿' },
  { id: 'guided', label: 'Guided / Given Direction', emoji: '🧭' },
];

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-200 border-yellow-400' },
  { id: 'green', label: 'Green', bg: 'bg-green-200 border-green-400' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-200 border-blue-400' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-200 border-pink-400' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-200 border-purple-400' },
];

export default function SaveBookmarkModal({
  isOpen,
  onClose,
  selectedVerses,
  bookMeta,
  chapter,
  onSaveBookmark
}) {
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [reflectionNote, setReflectionNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedColor('yellow');
      setSelectedFeelings([]);
      setReflectionNote('');
    }
  }, [isOpen]);

  if (!isOpen || !selectedVerses || selectedVerses.length === 0) return null;

  // Sort selected verses by verse number
  const sorted = [...selectedVerses].sort((a, b) => a.verse - b.verse);
  const verseNums = sorted.map(v => v.verse);
  
  // Format range citation, e.g. "3-5" or "3, 5, 7"
  let verseRangeStr = '';
  if (sorted.length === 1) {
    verseRangeStr = `${sorted[0].verse}`;
  } else {
    const isConsecutive = sorted.every((v, idx) => idx === 0 || v.verse === sorted[idx - 1].verse + 1);
    if (isConsecutive) {
      verseRangeStr = `${sorted[0].verse}–${sorted[sorted.length - 1].verse}`;
    } else {
      verseRangeStr = verseNums.join(', ');
    }
  }

  const combinedCitation = `${bookMeta?.modernName || ''} ${chapter}:${verseRangeStr}`;
  const combinedText = sorted.map(v => `[${v.verse}] ${v.text}`).join(' ');

  const handleToggleFeeling = (feelingId) => {
    setSelectedFeelings(prev => 
      prev.includes(feelingId)
        ? prev.filter(f => f !== feelingId)
        : [...prev, feelingId]
    );
  };

  const handleSave = () => {
    const feelingsData = selectedFeelings.map(id => {
      const match = FEELING_OPTIONS.find(f => f.id === id);
      return { id, label: match?.label || id, emoji: match?.emoji || '✨' };
    });

    onSaveBookmark({
      bookId: bookMeta?.id,
      bookName: bookMeta?.modernName,
      chapter: Number(chapter),
      verseNumbers: verseNums,
      verseRange: verseRangeStr,
      text: combinedText,
      color: selectedColor,
      note: reflectionNote.trim(),
      feelings: feelingsData,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#1a1917] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                Save to Bookmark
              </h2>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold font-mono">
                {combinedCitation} ({sorted.length} {sorted.length === 1 ? 'verse' : 'verses'})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Combined Scripture Preview */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 max-h-36 overflow-y-auto">
            <p className="font-serif italic text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              "{combinedText}"
            </p>
          </div>

          {/* 1. Highlight Color Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5 mb-2">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Highlight Color:</span>
            </label>
            <div className="flex items-center space-x-3">
              {HIGHLIGHT_COLORS.map((c) => {
                const isActive = selectedColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(isActive ? null : c.id)}
                    className={`w-8 h-8 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${c.bg} ${
                      isActive ? 'ring-2 ring-offset-2 ring-neutral-800 dark:ring-amber-400 scale-110' : ''
                    }`}
                    title={c.label}
                  >
                    {isActive && <Check className="w-4 h-4 text-neutral-900" />}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedColor(null)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  selectedColor === null
                    ? 'border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-neutral-800 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                No Color
              </button>
            </div>
          </div>

          {/* 2. "How does this verse make you feel?" */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>How does this verse make you feel?</span>
              <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {FEELING_OPTIONS.map((f) => {
                const isSelected = selectedFeelings.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleToggleFeeling(f.id)}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold shadow-xs ring-1 ring-amber-400 scale-102'
                        : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Personal Reflection / Note */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5 mb-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Personal Reflection / Note:</span>
              <span className="text-[11px] font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="What touched your heart? Write your meditation, personal prayer, or takeaways here..."
              rows={3}
              className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition transform active:scale-95"
          >
            <Bookmark className="w-4 h-4 fill-white" />
            <span>Save Bookmark</span>
          </button>
        </div>
      </div>
    </div>
  );
}

