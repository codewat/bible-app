import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import BibleReader from './components/BibleReader';
import MoodModal from './components/MoodModal';
import BookChapterDrawer from './components/BookChapterDrawer';
import SearchModal from './components/SearchModal';
import SaveBookmarkModal from './components/SaveBookmarkModal';
import JournalDrawer from './components/JournalDrawer';
import AudioPlayerBar from './components/AudioPlayerBar';
import PrayersModal from './components/PrayersModal';

import {
  getBookmarks,
  saveBookmarkWithDetails,
  removeBookmark,
  toggleBookmark,
  getHighlights,
  setVerseHighlight,
  getNotes,
  saveVerseNote,
  deleteVerseNote,
  getPreferences,
  savePreferences,
  getLastRead,
  setLastRead,
} from './utils/storage';
import { speechService } from './utils/speech';

export default function App() {
  const [booksMeta, setBooksMeta] = useState([]);
  const [currentBookId, setCurrentBookId] = useState('matthew');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentBookData, setCurrentBookData] = useState(null);
  const [booksCache, setBooksCache] = useState({});

  // Multi-verse selection state
  const [selectedVerses, setSelectedVerses] = useState([]);

  // Modals & Drawers state
  // "inig open sa app is mangutana siya 'how are you feeling today'" -> Starts open!
  const [isMoodOpen, setIsMoodOpen] = useState(true);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSaveBookmarkModalOpen, setIsSaveBookmarkModalOpen] = useState(false);
  const [isPrayersOpen, setIsPrayersOpen] = useState(false);

  // User saved data
  const [bookmarks, setBookmarks] = useState({});
  const [highlights, setHighlights] = useState({});
  const [notes, setNotes] = useState({});

  // Reading preferences: 5 themes ('light' | 'sepia' | 'marian' | 'dark' | 'olive')
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('text-base');
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans' | 'book'

  // Audio State
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    rate: 1.0,
  });
  const [currentVerseSpeaking, setCurrentVerseSpeaking] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    // Load local storage data
    setBookmarks(getBookmarks());
    setHighlights(getHighlights());
    setNotes(getNotes());

    const prefs = getPreferences();
    if (prefs.theme) setTheme(prefs.theme);
    if (prefs.fontSize) setFontSize(prefs.fontSize);
    if (prefs.fontFamily) setFontFamily(prefs.fontFamily);

    const last = getLastRead();
    if (last && last.bookId) {
      setCurrentBookId(last.bookId);
      setCurrentChapter(last.chapter || 1);
    }

    // Load books metadata
    fetch('/data/books-meta.json')
      .then((res) => res.json())
      .then((meta) => {
        setBooksMeta(meta);
      })
      .catch((err) => console.error('Error loading books-meta:', err));

    // Setup speech callbacks
    speechService.setCallbacks({
      onVerseChange: (v) => setCurrentVerseSpeaking(v),
      onStateChange: (state) => setAudioState(state),
    });

    return () => {
      speechService.stop();
    };
  }, []);

  // Update HTML class for themes (Light, Sepia, Marian Blue, Midnight, Gethsemane Olive)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'sepia-theme', 'theme-marian', 'theme-olive');
    document.body.className = '';

    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className = 'bg-[#121214] text-neutral-100 antialiased selection:bg-amber-900';
    } else if (theme === 'sepia') {
      root.classList.add('sepia-theme');
      document.body.className = 'bg-[#f4ecd8] text-[#433422] antialiased selection:bg-[#dfc8a5]';
    } else if (theme === 'marian') {
      root.classList.add('dark', 'theme-marian');
      document.body.className = 'theme-marian bg-[#0b1320] text-[#e5eaf2] antialiased selection:bg-blue-900';
    } else if (theme === 'olive') {
      root.classList.add('dark', 'theme-olive');
      document.body.className = 'theme-olive bg-[#121c13] text-[#e2e8e3] antialiased selection:bg-emerald-950';
    } else {
      document.body.className = 'bg-[#fbf8f1] text-neutral-900 antialiased selection:bg-amber-200';
    }
    savePreferences({ theme, fontSize, fontFamily });
  }, [theme, fontSize, fontFamily]);

  // Load current book data whenever currentBookId changes
  useEffect(() => {
    if (!currentBookId) return;

    if (booksCache[currentBookId]) {
      setCurrentBookData(booksCache[currentBookId]);
      return;
    }

    fetch(`/data/books/${currentBookId}.json`)
      .then((res) => res.json())
      .then((bookJson) => {
        setBooksCache((prev) => ({ ...prev, [currentBookId]: bookJson }));
        setCurrentBookData(bookJson);
      })
      .catch((err) => console.error(`Error loading book ${currentBookId}:`, err));
  }, [currentBookId, booksCache]);

  // Save last read to localStorage & clear verse selection when changing chapter
  useEffect(() => {
    setLastRead(currentBookId, currentChapter);
    setSelectedVerses([]);
  }, [currentBookId, currentChapter]);

  // Current book metadata
  const currentBookMeta = booksMeta.find((b) => b.id === currentBookId);
  const chapterVerses = currentBookData?.chapters?.[String(currentChapter)] || [];

  // Verse Selection Handlers
  const handleToggleVerseSelect = (verseObj) => {
    setSelectedVerses((prev) => {
      const exists = prev.some((v) => v.verse === verseObj.verse);
      if (exists) {
        return prev.filter((v) => v.verse !== verseObj.verse);
      } else {
        return [...prev, verseObj];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedVerses([]);
  };

  // Save Bookmark with highlight, reflection, and feelings
  const handleSaveBookmark = (bookmarkData) => {
    saveBookmarkWithDetails(bookmarkData);
    setBookmarks(getBookmarks());
    setHighlights(getHighlights());
    setNotes(getNotes());
    setSelectedVerses([]);
  };

  // Play Selected Verses
  const handlePlaySelectedVerses = (verses) => {
    speechService.playChapter(verses, 0);
  };

  // Navigation handlers
  const handleSelectBookChapter = (bookId, ch) => {
    speechService.stop();
    setCurrentBookId(bookId);
    setCurrentChapter(Number(ch));
    setSelectedVerses([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToVerse = (bookId, ch, verseNum) => {
    speechService.stop();
    setCurrentBookId(bookId);
    setCurrentChapter(Number(ch));

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (verseNum && currentBookData?.chapters?.[String(ch)]) {
        const v = currentBookData.chapters[String(ch)].find(
          (item) => item.verse === Number(verseNum)
        );
        if (v) {
          setSelectedVerses([v]);
        }
      }
    }, 200);
  };

  // Previous Chapter
  const hasPrev =
    currentChapter > 1 ||
    (booksMeta.findIndex((b) => b.id === currentBookId) > 0);

  const handlePrevChapter = () => {
    speechService.stop();
    if (currentChapter > 1) {
      setCurrentChapter((c) => c - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const curIdx = booksMeta.findIndex((b) => b.id === currentBookId);
      if (curIdx > 0) {
        const prevBook = booksMeta[curIdx - 1];
        setCurrentBookId(prevBook.id);
        setCurrentChapter(prevBook.chapterCount);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Next Chapter
  const curIdx = booksMeta.findIndex((b) => b.id === currentBookId);
  const hasNext =
    (currentBookMeta && currentChapter < currentBookMeta.chapterCount) ||
    curIdx < booksMeta.length - 1;

  const handleNextChapter = () => {
    speechService.stop();
    if (currentBookMeta && currentChapter < currentBookMeta.chapterCount) {
      setCurrentChapter((c) => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (curIdx < booksMeta.length - 1) {
      const nextBook = booksMeta[curIdx + 1];
      setCurrentBookId(nextBook.id);
      setCurrentChapter(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Audio Play Chapter
  const handlePlayChapterAudio = () => {
    if (audioState.isPlaying) {
      speechService.stop();
    } else {
      speechService.playChapter(chapterVerses, 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentBookMeta={currentBookMeta}
        currentChapter={currentChapter}
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMood={() => setIsMoodOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenPrayers={() => setIsPrayersOpen(true)}
        onPlayChapterAudio={handlePlayChapterAudio}
        isPlayingAudio={audioState.isPlaying}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
      />

      {/* Main Bible Reader */}
      <div className="flex-1">
        <BibleReader
          bookMeta={currentBookMeta}
          chapter={currentChapter}
          chapterVerses={chapterVerses}
          bookmarks={bookmarks}
          highlights={highlights}
          notes={notes}
          currentVerseSpeaking={currentVerseSpeaking}
          selectedVerses={selectedVerses}
          onToggleVerseSelect={handleToggleVerseSelect}
          onClearSelection={handleClearSelection}
          onOpenSaveBookmarkModal={() => setIsSaveBookmarkModalOpen(true)}
          onPlaySelectedVerses={handlePlaySelectedVerses}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          fontSize={fontSize}
          fontFamily={fontFamily}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </div>

      {/* Floating Audio Bar when audio is active */}
      <AudioPlayerBar
        audioState={audioState}
        currentVerseSpeaking={currentVerseSpeaking}
        bookName={currentBookMeta?.modernName || ''}
        chapter={currentChapter}
        onStopAudio={() => speechService.stop()}
      />

      {/* 1. "How are you feeling today?" Welcome / Mood Modal */}
      <MoodModal
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
        onNavigateToVerse={handleNavigateToVerse}
      />

      {/* 2. Select Book & Chapter Drawer */}
      <BookChapterDrawer
        isOpen={isBookPickerOpen}
        onClose={() => setIsBookPickerOpen(false)}
        booksMeta={booksMeta}
        currentBookId={currentBookId}
        currentChapter={currentChapter}
        onSelectBookChapter={handleSelectBookChapter}
      />

      {/* 3. Search Scripture Modal (All 73 books) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentBookId={currentBookId}
        currentBookName={currentBookMeta?.modernName || ''}
        onNavigateToVerse={handleNavigateToVerse}
      />

      {/* 4. Combined Save to Bookmark Modal (Highlight, Reflection Note, & "How does this verse make you feel") */}
      <SaveBookmarkModal
        isOpen={isSaveBookmarkModalOpen}
        onClose={() => setIsSaveBookmarkModalOpen(false)}
        selectedVerses={selectedVerses}
        bookMeta={currentBookMeta}
        chapter={currentChapter}
        onSaveBookmark={handleSaveBookmark}
      />

      {/* 5. Catholic Prayers & Rosary Modal */}
      <PrayersModal
        isOpen={isPrayersOpen}
        onClose={() => setIsPrayersOpen(false)}
      />

      {/* 6. Journal Drawer (Bookmarks, Notes with feelings, Highlights) */}
      <JournalDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        bookmarks={bookmarks}
        highlights={highlights}
        notes={notes}
        onRemoveBookmark={(bm) => {
          removeBookmark(bm.id || `${bm.bookId}:${bm.chapter}:${bm.verseRange || bm.verse}`);
          setBookmarks(getBookmarks());
        }}
        onRemoveHighlight={(bId, ch, v) => {
          const updated = setVerseHighlight(bId, ch, v, null);
          setHighlights(updated);
        }}
        onDeleteNote={(key) => {
          const updated = deleteVerseNote(key);
          setNotes(updated);
        }}
        onNavigateToVerse={handleNavigateToVerse}
      />
    </div>
  );
}
