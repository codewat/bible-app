const STORAGE_KEYS = {
  BOOKMARKS: 'catholic_bible_bookmarks',
  HIGHLIGHTS: 'catholic_bible_highlights',
  NOTES: 'catholic_bible_notes',
  PREFERENCES: 'catholic_bible_prefs',
  LAST_READ: 'catholic_bible_last_read',
};

// Safe JSON get/set
function getStored(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// Bookmarks: map of bookmarkId -> { id, bookId, bookName, chapter, verseNumbers, verseRange, text, color, note, feelings, savedAt }
export function getBookmarks() {
  return getStored(STORAGE_KEYS.BOOKMARKS, {});
}

export function isBookmarked(bookId, chapter, verse) {
  const bookmarks = getBookmarks();
  // Check if this verse is part of any bookmark in this chapter
  for (const b of Object.values(bookmarks)) {
    if (b.bookId === bookId && Number(b.chapter) === Number(chapter)) {
      if (b.verseNumbers && b.verseNumbers.includes(Number(verse))) {
        return true;
      }
      if (Number(b.verse) === Number(verse)) {
        return true;
      }
    }
  }
  return false;
}

export function saveBookmarkWithDetails(item) {
  const bookmarks = getBookmarks();
  const id = item.id || `${item.bookId}:${item.chapter}:${item.verseRange || item.verse}`;
  
  bookmarks[id] = {
    ...item,
    id,
    savedAt: new Date().toISOString()
  };
  setStored(STORAGE_KEYS.BOOKMARKS, bookmarks);

  // If a highlight color is selected, also apply highlight to all included verse numbers
  if (item.color) {
    const highlights = getHighlights();
    const verseList = item.verseNumbers && item.verseNumbers.length > 0 
      ? item.verseNumbers 
      : [item.verse];

    verseList.forEach((vNum) => {
      const vKey = `${item.bookId}:${item.chapter}:${vNum}`;
      highlights[vKey] = {
        color: item.color,
        bookId: item.bookId,
        chapter: item.chapter,
        verse: vNum,
        updatedAt: new Date().toISOString()
      };
    });
    setStored(STORAGE_KEYS.HIGHLIGHTS, highlights);
  }

  // If a note is provided, also store in notes
  if (item.note && item.note.trim()) {
    const notes = getNotes();
    notes[id] = {
      bookId: item.bookId,
      bookName: item.bookName,
      chapter: item.chapter,
      verseRange: item.verseRange || String(item.verse),
      verseText: item.text,
      text: item.note.trim(),
      feelings: item.feelings || [],
      updatedAt: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.NOTES, notes);
  }

  return bookmarks;
}

export function removeBookmark(id) {
  const bookmarks = getBookmarks();
  if (bookmarks[id]) {
    delete bookmarks[id];
    setStored(STORAGE_KEYS.BOOKMARKS, bookmarks);
  }
  return bookmarks;
}

export function toggleBookmark(item) {
  const bookmarks = getBookmarks();
  const key = item.id || `${item.bookId}:${item.chapter}:${item.verseRange || item.verse}`;
  if (bookmarks[key]) {
    delete bookmarks[key];
    setStored(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return false;
  } else {
    bookmarks[key] = {
      ...item,
      id: key,
      savedAt: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return true;
  }
}

// Highlights: map of verseKey -> { color, updatedAt }
export function getHighlights() {
  return getStored(STORAGE_KEYS.HIGHLIGHTS, {});
}

export function setVerseHighlight(bookId, chapter, verse, color) {
  const highlights = getHighlights();
  const key = `${bookId}:${chapter}:${verse}`;
  if (!color) {
    delete highlights[key];
  } else {
    highlights[key] = {
      color,
      bookId,
      chapter,
      verse,
      updatedAt: new Date().toISOString()
    };
  }
  setStored(STORAGE_KEYS.HIGHLIGHTS, highlights);
  return highlights;
}

export function setMultipleVerseHighlights(bookId, chapter, verseNumbers, color) {
  const highlights = getHighlights();
  verseNumbers.forEach((v) => {
    const key = `${bookId}:${chapter}:${v}`;
    if (!color) {
      delete highlights[key];
    } else {
      highlights[key] = {
        color,
        bookId,
        chapter,
        verse: v,
        updatedAt: new Date().toISOString()
      };
    }
  });
  setStored(STORAGE_KEYS.HIGHLIGHTS, highlights);
  return highlights;
}

// Notes: map of noteKey -> { text, bookId, bookName, chapter, verse, verseRange, verseText, feelings, updatedAt }
export function getNotes() {
  return getStored(STORAGE_KEYS.NOTES, {});
}

export function saveVerseNote(item, text, feelings = []) {
  const notes = getNotes();
  const key = item.id || `${item.bookId}:${item.chapter}:${item.verseRange || item.verse}`;
  if (!text || !text.trim()) {
    delete notes[key];
  } else {
    notes[key] = {
      ...item,
      text: text.trim(),
      feelings,
      updatedAt: new Date().toISOString()
    };
  }
  setStored(STORAGE_KEYS.NOTES, notes);
  return notes;
}

export function deleteVerseNote(idOrKey) {
  const notes = getNotes();
  delete notes[idOrKey];
  setStored(STORAGE_KEYS.NOTES, notes);
  return notes;
}

// Preferences
export function getPreferences() {
  return getStored(STORAGE_KEYS.PREFERENCES, {
    theme: 'light', // 'light' | 'dark' | 'sepia'
    fontSize: 'text-base', // 'text-sm' | 'text-base' | 'text-lg' | 'text-xl'
    fontFamily: 'serif', // 'serif' | 'sans'
    readingMode: false,
    audioRate: 1.0,
  });
}

export function savePreferences(prefs) {
  setStored(STORAGE_KEYS.PREFERENCES, prefs);
}

// Last read
export function getLastRead() {
  return getStored(STORAGE_KEYS.LAST_READ, {
    bookId: 'matthew',
    chapter: 1,
  });
}

export function setLastRead(bookId, chapter) {
  setStored(STORAGE_KEYS.LAST_READ, { bookId, chapter });
}
