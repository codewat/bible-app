import React, { useState, useEffect } from 'react';
import { 
  X, Bookmark, Volume2, Copy, Check, Trash2, Edit3, 
  Palette, Highlighter, MessageSquare 
} from 'lucide-react';
import { speechService } from '../utils/speech';

export default function VerseActionModal({
  isOpen,
  onClose,
  verseItem,
  isBookmarked,
  onToggleBookmark,
  currentHighlight,
  onSetHighlight,
  noteText,
  onSaveNote,
  onDeleteNote,
}) {
  const [activeNoteText, setActiveNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setActiveNoteText(noteText || '');
    setCopied(false);
    setIsSpeaking(false);
  }, [verseItem, noteText]);

  if (!isOpen || !verseItem) return null;

  const colors = [
    { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-200 border-yellow-400' },
    { id: 'green', label: 'Green', bg: 'bg-green-200 border-green-400' },
    { id: 'blue', label: 'Blue', bg: 'bg-blue-200 border-blue-400' },
    { id: 'pink', label: 'Pink', bg: 'bg-pink-200 border-pink-400' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-200 border-purple-400' },
  ];

  const handleCopy = () => {
    const textToCopy = `"${verseItem.text}" — ${verseItem.bookName} ${verseItem.chapter}:${verseItem.verse} (Douay-Rheims Catholic Bible)`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.playSingleVerse({
        verse: verseItem.verse,
        text: verseItem.text
      });
      setTimeout(() => setIsSpeaking(false), 6000);
    }
  };

  const handleSaveNote = () => {
    onSaveNote(activeNoteText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full sm:max-w-xl bg-white dark:bg-[#1a1917] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col overflow-hidden animate-slideUp sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40">
          <div>
            <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              {verseItem.bookName} {verseItem.chapter}:{verseItem.verse}
            </h3>
            <p className="text-xs text-neutral-500">Catholic Douay-Rheims</p>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verse snippet */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <blockquote className="text-sm font-serif italic text-neutral-700 dark:text-neutral-300 border-l-3 border-amber-600 dark:border-amber-400 pl-3 leading-relaxed">
            "{verseItem.text}"
          </blockquote>

          {/* Quick Action Toolbar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleBookmark}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                isBookmarked 
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-semibold' 
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              onClick={handleSpeak}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                isSpeaking 
                  ? 'bg-amber-600 text-white border-amber-600 animate-pulse' 
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Playing...' : 'Audio'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-medium border bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Highlights Selector */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-2">
              Highlight Color:
            </span>
            <div className="flex items-center space-x-3">
              {colors.map((c) => {
                const isActive = currentHighlight === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSetHighlight(isActive ? null : c.id)}
                    className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${c.bg} ${
                      isActive ? 'ring-2 ring-offset-2 ring-neutral-700 dark:ring-amber-400 scale-110' : ''
                    }`}
                    title={c.label}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-neutral-800" />}
                  </button>
                );
              })}
              {currentHighlight && (
                <button
                  onClick={() => onSetHighlight(null)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline pl-2 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Personal Note Section */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Personal Reflection / Note:</span>
              </span>
              {noteText && (
                <button
                  onClick={onDeleteNote}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <textarea
              value={activeNoteText}
              onChange={(e) => setActiveNoteText(e.target.value)}
              placeholder="Write your Catholic meditation, thoughts, prayer, or notes for this verse..."
              rows={3}
              className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSaveNote}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition shadow-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
