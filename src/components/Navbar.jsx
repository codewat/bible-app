import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Bookmark, Sparkles, Volume2, 
  Settings, ChevronDown, Check, Type, Download 
} from 'lucide-react';

export default function Navbar({
  currentBookMeta,
  currentChapter,
  onOpenBookPicker,
  onOpenSearch,
  onOpenMood,
  onOpenJournal,
  onOpenPrayers,
  onPlayChapterAudio,
  isPlayingAudio,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      alert('To install on iOS/Safari: tap the Share button and select "Add to Home Screen". On Chrome/Desktop, click the install icon in the address bar.');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const fontSizes = [
    { id: 'text-sm', label: 'Small' },
    { id: 'text-base', label: 'Default' },
    { id: 'text-lg', label: 'Large' },
    { id: 'text-xl', label: 'Extra Large' },
  ];

  const themes = [
    { id: 'light', label: 'Ivory Light', bg: 'bg-[#fbf8f1] text-amber-950 border-amber-300' },
    { id: 'sepia', label: 'Warm Sepia', bg: 'bg-[#f4ecd8] text-[#433422] border-amber-400' },
    { id: 'marian', label: 'Marian Blue', bg: 'bg-[#0c1524] text-[#e5eaf2] border-blue-500' },
    { id: 'dark', label: 'Midnight', bg: 'bg-[#121214] text-neutral-100 border-neutral-700' },
    { id: 'olive', label: 'Gethsemane', bg: 'bg-[#152016] text-[#e2e8e3] border-emerald-600' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#fbf8f1]/95 dark:bg-[#151518]/95 backdrop-blur-md border-b border-amber-900/10 dark:border-amber-500/10 transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Catholic Cross & Book Selector */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-xl sm:text-2xl select-none" role="img" aria-label="cross">
              ✝️
            </span>
          </div>

          {/* Book & Chapter Trigger Button */}
          <button
            onClick={onOpenBookPicker}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-950 dark:text-amber-100 font-serif font-bold text-sm sm:text-base border border-amber-300/60 dark:border-neutral-700 shadow-xs transition group truncate"
          >
            <span className="truncate">
              {currentBookMeta ? currentBookMeta.modernName : 'Loading...'} {currentChapter}
            </span>
            <ChevronDown className="w-4 h-4 text-amber-800 dark:text-amber-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Catholic Prayers & Rosary Button */}
          <button
            onClick={onOpenPrayers}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/90 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-950 dark:text-amber-200 font-medium text-xs sm:text-sm border border-amber-300/50 dark:border-neutral-700 transition"
            title="Holy Rosary, Divine Mercy, and Catholic Prayers"
          >
            <span className="text-sm">📿</span>
            <span className="hidden md:inline">Prayers & Rosary</span>
            <span className="md:hidden">Prayers</span>
          </button>

          {/* "How are you feeling?" Button */}
          <button
            onClick={onOpenMood}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-xs sm:text-sm shadow-sm hover:shadow transition transform active:scale-95 shrink-0"
            title="How are you feeling today?"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feelings</span>
          </button>

          {/* Audio Chapter Button */}
          <button
            onClick={onPlayChapterAudio}
            className={`p-2 rounded-xl transition ${
              isPlayingAudio
                ? 'bg-amber-600 text-white animate-pulse'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-amber-100/70 dark:hover:bg-neutral-800'
            }`}
            title="Listen to this chapter"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-amber-100/70 dark:hover:bg-neutral-800 rounded-xl transition"
            title="Search Bible (73 Books)"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Saved / Bookmarks Button */}
          <button
            onClick={onOpenJournal}
            className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-amber-100/70 dark:hover:bg-neutral-800 rounded-xl transition"
            title="My Saved Verses & Notes"
          >
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Settings / Appearance Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-amber-100/70 dark:hover:bg-neutral-800 rounded-xl transition"
              title="Reading Preferences"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Settings Dropdown Popover */}
            {showSettings && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e1c19] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 z-50 text-xs animate-fadeIn space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    Reading Preferences
                  </span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    ✕
                  </button>
                </div>

                {/* 1. Theme Selector (5 Catholic & Reading Themes) */}
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-2 font-medium">
                    Theme / Appearance
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {themes.map((t) => {
                      const isActive = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`py-2 px-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${t.bg} ${
                            isActive ? 'ring-2 ring-amber-500 font-bold shadow-xs' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <span>{t.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Font Size */}
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-2 font-medium">
                    Font Size
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {fontSizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFontSize(s.id)}
                        className={`py-1.5 rounded-lg border text-center text-xs transition ${
                          fontSize === s.id
                            ? 'bg-amber-600 border-amber-600 text-white font-bold'
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {s.label[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Typography */}
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block mb-2 font-medium">
                    Typography
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setFontFamily('serif')}
                      className={`py-2 rounded-lg border font-serif text-center transition ${
                        fontFamily === 'serif'
                          ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold dark:bg-amber-950/40 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Holy Serif
                    </button>
                    <button
                      onClick={() => setFontFamily('sans')}
                      className={`py-2 rounded-lg border font-sans text-center transition ${
                        fontFamily === 'sans'
                          ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold dark:bg-amber-950/40 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Clean Sans
                    </button>
                    <button
                      onClick={() => setFontFamily('book')}
                      className={`py-2 rounded-lg border font-book text-center transition ${
                        fontFamily === 'book'
                          ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold dark:bg-amber-950/40 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Book Antiqua
                    </button>
                  </div>
                </div>

                {/* 4. PWA Install App Button */}
                {!isInstalled && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={handleInstallApp}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install App on Phone / Mac</span>
                    </button>
                    <p className="text-[10px] text-neutral-400 text-center mt-1">
                      Works 100% offline like a native app
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
