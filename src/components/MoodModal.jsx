import React, { useState } from 'react';
import { MOODS } from '../data/moodVerses';
import { Sparkles, BookOpen, Volume2, Bookmark, Check, RefreshCw, X, ArrowLeft, Heart } from 'lucide-react';
import { speechService } from '../utils/speech';
import { toggleBookmark, isBookmarked } from '../utils/storage';

export default function MoodModal({ isOpen, onClose, onNavigateToVerse }) {
  const [selectedMoodId, setSelectedMoodId] = useState(null);
  const [verseIndex, setVerseIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const currentMood = MOODS.find(m => m.id === selectedMoodId);
  const currentVerse = currentMood ? currentMood.verses[verseIndex % currentMood.verses.length] : null;

  const handleSelectMood = (moodId) => {
    setSelectedMoodId(moodId);
    setVerseIndex(0);
    speechService.stop();
    setIsPlayingAudio(false);
    
    const mood = MOODS.find(m => m.id === moodId);
    if (mood && mood.verses[0]) {
      const v = mood.verses[0];
      setBookmarked(isBookmarked(v.bookId, v.chapter, v.verse));
    }
  };

  const handleNextVerse = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    if (!currentMood) return;
    const nextIdx = (verseIndex + 1) % currentMood.verses.length;
    setVerseIndex(nextIdx);
    const v = currentMood.verses[nextIdx];
    setBookmarked(isBookmarked(v.bookId, v.chapter, v.verse));
  };

  const handleToggleBookmark = () => {
    if (!currentVerse) return;
    const isNow = toggleBookmark({
      bookId: currentVerse.bookId,
      bookName: currentVerse.bookName,
      chapter: currentVerse.chapter,
      verse: currentVerse.verse,
      text: currentVerse.text
    });
    setBookmarked(isNow);
  };

  const handleListen = () => {
    if (!currentVerse) return;
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speechService.playSingleVerse({
        verse: currentVerse.verse,
        text: currentVerse.text
      });
      // Reset indicator when speech completes
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 7000);
    }
  };

  const handleGoToVerse = () => {
    if (!currentVerse) return;
    speechService.stop();
    onNavigateToVerse(currentVerse.bookId, currentVerse.chapter, currentVerse.verse);
    onClose();
  };

  const handleClose = () => {
    speechService.stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1917] rounded-2xl shadow-2xl border border-amber-900/10 dark:border-amber-500/20 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-2.5">
            {selectedMoodId && (
              <button 
                onClick={() => {
                  setSelectedMoodId(null);
                  speechService.stop();
                  setIsPlayingAudio(false);
                }}
                className="p-1.5 -ml-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                title="Back to feelings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {selectedMoodId ? currentMood.label : "How are you feeling today?"}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedMoodId 
                  ? "Catholic scripture for your heart and soul" 
                  : "Pick an emotion to receive holy scripture and peace"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!selectedMoodId && (
              <button
                onClick={handleClose}
                className="text-xs px-3 py-1.5 font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition"
              >
                Skip to Bible
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!selectedMoodId ? (
            /* Mood selection grid */
            <div>
              <div className="text-center mb-5">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Select what you are carrying right now. God's Word has a message for you.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleSelectMood(mood.id)}
                    className="group relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-500/50 bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-800/40 dark:to-neutral-900/40 hover:shadow-md transition-all text-center hover:-translate-y-0.5"
                  >
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                      {mood.emoji}
                    </span>
                    <span className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-tight">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Scripture and reflection view */
            currentVerse && (
              <div className="space-y-5 animate-fadeIn">
                {/* Verse Card */}
                <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-amber-100/40 dark:from-neutral-800 dark:via-neutral-800/60 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-700/30 shadow-sm">
                  {/* Citation Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      {currentVerse.citation}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Douay-Rheims (Catholic Bible)
                    </span>
                  </div>

                  {/* Scripture Text */}
                  <blockquote className="font-serif text-lg sm:text-xl leading-relaxed text-neutral-900 dark:text-neutral-100 italic my-4 border-l-4 border-amber-600 dark:border-amber-400 pl-4">
                    "{currentVerse.text}"
                  </blockquote>

                  {/* Reflection Card */}
                  <div className="mt-4 p-3.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-amber-200/50 dark:border-neutral-700/50 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                      ✝️ Holy Reflection:
                    </span>
                    {currentVerse.reflection}
                  </div>

                  {/* Action Buttons within Card */}
                  <div className="mt-5 pt-4 border-t border-amber-200/60 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleListen}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isPlayingAudio 
                            ? 'bg-amber-600 text-white animate-pulse'
                            : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600'
                        }`}
                        title="Listen to verse spoken aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlayingAudio ? 'Listening...' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={handleToggleBookmark}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          bookmarked 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600'
                        }`}
                        title="Bookmark verse"
                      >
                        {bookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
                      </button>
                    </div>

                    {currentMood.verses.length > 1 && (
                      <button
                        onClick={handleNextVerse}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-neutral-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Another verse ({verseIndex + 1}/{currentMood.verses.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Button to Open Full Chapter */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedMoodId(null);
                      speechService.stop();
                    }}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
                  >
                    Choose another feeling
                  </button>

                  <button
                    onClick={handleGoToVerse}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition transform active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Full Chapter ({currentVerse.bookName} {currentVerse.chapter})</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Catholic Holy Bible • 73 Canonical Books</span>
          </div>
          <button
            onClick={handleClose}
            className="hover:underline text-amber-800 dark:text-amber-300 font-medium"
          >
            Go to Bible Reader →
          </button>
        </div>
      </div>
    </div>
  );
}

