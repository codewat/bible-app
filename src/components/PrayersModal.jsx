import React, { useState, useEffect } from 'react';
import { 
  X, Volume2, Sparkles, ChevronRight, ChevronLeft, 
  RotateCcw, Check, BookOpen, Heart, Shield, Globe 
} from 'lucide-react';
import { 
  ROSARY_MYSTERIES, 
  ROSARY_LANGUAGES,
  ROSARY_PRAYERS,
  getPrayerForBead,
  COMMON_PRAYERS, 
  TRADITIONAL_PRAYERS, 
  getTodaysMysteryKey 
} from '../data/prayers';
import { speechService } from '../utils/speech';

export default function PrayersModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('rosary'); // 'rosary' | 'divine_mercy' | 'traditional'
  
  // Rosary State
  const [rosarySection, setRosarySection] = useState('decade'); // 'intro' | 'decade' | 'concluding'
  const [selectedMysteryKey, setSelectedMysteryKey] = useState(getTodaysMysteryKey());
  const [activeDecadeIndex, setActiveDecadeIndex] = useState(0);
  const [beadIndex, setBeadIndex] = useState(0); // 0 = Our Father, 1..10 = Hail Marys, 11 = Glory Be & Fatima
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingPrayerKey, setPlayingPrayerKey] = useState(null);
  const [showMeditation, setShowMeditation] = useState(false);
  
  // Language for Rosary Prayers (en, ceb, tl, la)
  const [rosaryLang, setRosaryLang] = useState(() => {
    try {
      return localStorage.getItem('catholic_rosary_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const getNextBeadLabel = () => {
    if (beadIndex === 0) {
      return 'Next Bead: Hail Mary (1/10) →';
    }
    if (beadIndex >= 1 && beadIndex < 10) {
      return `Next Bead: Hail Mary (${beadIndex + 1}/10) →`;
    }
    if (beadIndex === 10) {
      return 'Next Bead: Glory Be & Fatima →';
    }
    // beadIndex === 11
    if (activeDecadeIndex < 4) {
      return `Next: Decade ${activeDecadeIndex + 2} →`;
    }
    return 'Finish Rosary & Salve Regina ✨';
  };

  const handleSetLang = (langId) => {
    speechService.stop();
    setIsPlayingAudio(false);
    setPlayingPrayerKey(null);
    setRosaryLang(langId);
    try {
      localStorage.setItem('catholic_rosary_lang', langId);
    } catch (e) {
      console.warn(e);
    }
  };

  // Traditional Prayers State
  const [selectedPrayerId, setSelectedPrayerId] = useState(null);
  const [prayerCategory, setPrayerCategory] = useState('ALL');

  // Keep audio state in sync
  useEffect(() => {
    const unsubscribe = speechService.addStateListener((state) => {
      if (!state.isPlaying) {
        setIsPlayingAudio(false);
        setPlayingPrayerKey(null);
      }
    });
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  if (!isOpen) return null;

  const currentMystery = ROSARY_MYSTERIES[selectedMysteryKey];
  const currentDecade = currentMystery.decades[activeDecadeIndex];
  const currentBeadPrayer = getPrayerForBead(beadIndex, rosaryLang);

  const handleNextBead = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setPlayingPrayerKey(null);

    if (beadIndex < 11) {
      setBeadIndex(beadIndex + 1);
    } else {
      // Advance to next decade or concluding prayers
      if (activeDecadeIndex < 4) {
        setActiveDecadeIndex(activeDecadeIndex + 1);
        setBeadIndex(0);
      } else {
        // Finished all 5 decades
        setRosarySection('concluding');
      }
    }
  };

  const handlePrevBead = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setPlayingPrayerKey(null);

    if (beadIndex > 0) {
      setBeadIndex(beadIndex - 1);
    } else if (activeDecadeIndex > 0) {
      setActiveDecadeIndex(activeDecadeIndex - 1);
      setBeadIndex(11);
    }
  };

  const handleResetBeads = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setPlayingPrayerKey(null);
    setBeadIndex(0);
  };

  const handleSpeakPrayer = (text, lang = 'en-US', prayerKey = 'default') => {
    if (isPlayingAudio && playingPrayerKey === prayerKey) {
      speechService.stop();
      setIsPlayingAudio(false);
      setPlayingPrayerKey(null);
    } else {
      speechService.stop();
      setIsPlayingAudio(true);
      setPlayingPrayerKey(prayerKey);
      speechService.playSingleVerse({ text, lang });
    }
  };

  const handleClose = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    setPlayingPrayerKey(null);
    onClose();
  };

  const divineMercyPrayer = TRADITIONAL_PRAYERS.find(p => p.id === 'divine_mercy');

  const filteredTraditionalPrayers = TRADITIONAL_PRAYERS.filter(p => {
    if (p.id === 'divine_mercy') return false; // Handled in dedicated tab
    if (prayerCategory !== 'ALL' && p.category !== prayerCategory) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-[#1a1917] rounded-2xl shadow-2xl border border-amber-900/10 dark:border-amber-500/20 h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl select-none" role="img" aria-label="cross">📿</span>
            <div>
              <h2 className="text-lg font-serif font-bold text-neutral-900 dark:text-neutral-100">
                Catholic Prayer Book & Rosary
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Holy Rosary, Divine Mercy Chaplet, and Traditional Catholic Prayers
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('rosary')}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'rosary'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>📿</span>
            <span>Holy Rosary</span>
          </button>

          <button
            onClick={() => setActiveTab('divine_mercy')}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'divine_mercy'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>✝️</span>
            <span>Divine Mercy</span>
          </button>

          <button
            onClick={() => setActiveTab('traditional')}
            className={`flex-1 py-3 text-center transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'traditional'
                ? 'border-amber-600 text-amber-900 dark:text-amber-200 font-bold bg-white dark:bg-neutral-800'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>📖</span>
            <span>Daily Prayers ({filteredTraditionalPrayers.length})</span>
          </button>
        </div>

        {/* Tab 1: Holy Rosary */}
        {activeTab === 'rosary' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Rosary Section Switcher */}
            <div className="flex items-center space-x-1.5 p-1 bg-amber-100/60 dark:bg-neutral-900/60 rounded-xl border border-amber-200/50 dark:border-neutral-800 text-xs">
              <button
                onClick={() => {
                  speechService.stop();
                  setIsPlayingAudio(false);
                  setPlayingPrayerKey(null);
                  setRosarySection('intro');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center space-x-1 ${
                  rosarySection === 'intro'
                    ? 'bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>✝️</span>
                <span>Opening Prayers</span>
              </button>

              <button
                onClick={() => {
                  speechService.stop();
                  setIsPlayingAudio(false);
                  setPlayingPrayerKey(null);
                  setRosarySection('decade');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center space-x-1 ${
                  rosarySection === 'decade'
                    ? 'bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>📿</span>
                <span>5 Decades & Beads</span>
              </button>

              <button
                onClick={() => {
                  speechService.stop();
                  setIsPlayingAudio(false);
                  setPlayingPrayerKey(null);
                  setRosarySection('concluding');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center space-x-1 ${
                  rosarySection === 'concluding'
                    ? 'bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>👑</span>
                <span>Closing Prayers</span>
              </button>
            </div>

            {/* SECTION 1: OPENING PRAYERS */}
            {rosarySection === 'intro' && (
              <div className="space-y-4">
                {/* Header & Language selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 rounded-xl bg-amber-50/70 dark:bg-neutral-900/40 border border-amber-200/80 dark:border-neutral-800">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
                      Introductory Prayers of the Rosary
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Sign of the Cross, Apostles' Creed, and Opening Intentions
                    </p>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                    <Globe className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                    {ROSARY_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleSetLang(lang.id)}
                        className={`px-2 py-0.5 rounded-md transition ${
                          rosaryLang === lang.id
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title={lang.label}
                      >
                        {lang.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Sign of the Cross */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        {ROSARY_PRAYERS.sign_of_cross[rosaryLang]?.title || ROSARY_PRAYERS.sign_of_cross.en.title}
                      </h4>
                      <span className="text-[11px] italic text-amber-800/80 dark:text-amber-400 font-serif">
                        {ROSARY_PRAYERS.sign_of_cross[rosaryLang]?.latinTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSpeakPrayer(
                        ROSARY_PRAYERS.sign_of_cross[rosaryLang]?.text || ROSARY_PRAYERS.sign_of_cross.en.text,
                        ROSARY_PRAYERS.sign_of_cross[rosaryLang]?.speechLang || 'en-US',
                        'sign_of_cross'
                      )}
                      className="p-1.5 rounded-lg text-xs bg-amber-50 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700 hover:bg-amber-100 transition flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio && playingPrayerKey === 'sign_of_cross' ? 'Listening...' : 'Audio'}</span>
                    </button>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {ROSARY_PRAYERS.sign_of_cross[rosaryLang]?.text || ROSARY_PRAYERS.sign_of_cross.en.text}
                  </p>
                </div>

                {/* 2. Apostles' Creed */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        {ROSARY_PRAYERS.apostles_creed[rosaryLang]?.title || ROSARY_PRAYERS.apostles_creed.en.title}
                      </h4>
                      <span className="text-[11px] italic text-amber-800/80 dark:text-amber-400 font-serif">
                        {ROSARY_PRAYERS.apostles_creed[rosaryLang]?.latinTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSpeakPrayer(
                        ROSARY_PRAYERS.apostles_creed[rosaryLang]?.text || ROSARY_PRAYERS.apostles_creed.en.text,
                        ROSARY_PRAYERS.apostles_creed[rosaryLang]?.speechLang || 'en-US',
                        'apostles_creed'
                      )}
                      className="p-1.5 rounded-lg text-xs bg-amber-50 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700 hover:bg-amber-100 transition flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio && playingPrayerKey === 'apostles_creed' ? 'Listening...' : 'Audio'}</span>
                    </button>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {ROSARY_PRAYERS.apostles_creed[rosaryLang]?.text || ROSARY_PRAYERS.apostles_creed.en.text}
                  </p>
                </div>

                {/* Opening Intentions note */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-neutral-800/40 border border-amber-200/50 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                  <span className="font-semibold text-amber-900 dark:text-amber-300 block">
                    Introductory Beads on the Crucifix Pendant:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>1 <strong>Our Father</strong> for the intentions of our Holy Father the Pope</li>
                    <li>3 <strong>Hail Marys</strong> for an increase in the virtues of Faith, Hope, and Charity</li>
                    <li>1 <strong>Glory Be</strong> praising the Holy Trinity</li>
                  </ul>
                </div>

                {/* Proceed button */}
                <button
                  onClick={() => {
                    speechService.stop();
                    setIsPlayingAudio(false);
                    setPlayingPrayerKey(null);
                    setRosarySection('decade');
                    setActiveDecadeIndex(0);
                    setBeadIndex(0);
                  }}
                  className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow transition flex items-center justify-center space-x-1.5"
                >
                  <span>Begin 1st Decade →</span>
                </button>
              </div>
            )}

            {/* SECTION 2: CONCLUDING PRAYERS */}
            {rosarySection === 'concluding' && (
              <div className="space-y-4">
                {/* Header & Language selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 rounded-xl bg-amber-50/70 dark:bg-neutral-900/40 border border-amber-200/80 dark:border-neutral-800">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                      <span>👑</span>
                      <span>Holy Rosary Concluding Prayers</span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Hail, Holy Queen and Rosary Closing Collect
                    </p>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold">
                    <Globe className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                    {ROSARY_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleSetLang(lang.id)}
                        className={`px-2 py-0.5 rounded-md transition ${
                          rosaryLang === lang.id
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                        title={lang.label}
                      >
                        {lang.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Hail Holy Queen */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        {ROSARY_PRAYERS.hail_holy_queen[rosaryLang]?.title || ROSARY_PRAYERS.hail_holy_queen.en.title}
                      </h4>
                      <span className="text-[11px] italic text-amber-800/80 dark:text-amber-400 font-serif">
                        {ROSARY_PRAYERS.hail_holy_queen[rosaryLang]?.latinTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSpeakPrayer(
                        ROSARY_PRAYERS.hail_holy_queen[rosaryLang]?.text || ROSARY_PRAYERS.hail_holy_queen.en.text,
                        ROSARY_PRAYERS.hail_holy_queen[rosaryLang]?.speechLang || 'en-US',
                        'hail_holy_queen'
                      )}
                      className="p-1.5 rounded-lg text-xs bg-amber-50 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700 hover:bg-amber-100 transition flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio && playingPrayerKey === 'hail_holy_queen' ? 'Listening...' : 'Audio'}</span>
                    </button>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                    {ROSARY_PRAYERS.hail_holy_queen[rosaryLang]?.text || ROSARY_PRAYERS.hail_holy_queen.en.text}
                  </p>
                </div>

                {/* 2. Concluding Rosary Prayer */}
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                        {ROSARY_PRAYERS.closing_prayer[rosaryLang]?.title || ROSARY_PRAYERS.closing_prayer.en.title}
                      </h4>
                      <span className="text-[11px] italic text-amber-800/80 dark:text-amber-400 font-serif">
                        {ROSARY_PRAYERS.closing_prayer[rosaryLang]?.latinTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSpeakPrayer(
                        ROSARY_PRAYERS.closing_prayer[rosaryLang]?.text || ROSARY_PRAYERS.closing_prayer.en.text,
                        ROSARY_PRAYERS.closing_prayer[rosaryLang]?.speechLang || 'en-US',
                        'closing_prayer'
                      )}
                      className="p-1.5 rounded-lg text-xs bg-amber-50 dark:bg-neutral-800 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700 hover:bg-amber-100 transition flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio && playingPrayerKey === 'closing_prayer' ? 'Listening...' : 'Audio'}</span>
                    </button>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                    {ROSARY_PRAYERS.closing_prayer[rosaryLang]?.text || ROSARY_PRAYERS.closing_prayer.en.text}
                  </p>
                </div>

                {/* Return button */}
                <button
                  onClick={() => {
                    speechService.stop();
                    setIsPlayingAudio(false);
                    setPlayingPrayerKey(null);
                    setRosarySection('decade');
                  }}
                  className="w-full py-3 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-sm transition flex items-center justify-center space-x-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Return to Decades</span>
                </button>
              </div>
            )}

            {/* SECTION 3: 5 DECADES & INTERACTIVE BEADS */}
            {rosarySection === 'decade' && (
              <>
                {/* Compact Mystery Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.values(ROSARY_MYSTERIES).map((m) => {
                    const isSelected = selectedMysteryKey === m.id;
                    const isToday = getTodaysMysteryKey() === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          speechService.stop();
                          setIsPlayingAudio(false);
                          setPlayingPrayerKey(null);
                          setSelectedMysteryKey(m.id);
                          setActiveDecadeIndex(0);
                          setBeadIndex(0);
                        }}
                        className={`p-2 rounded-xl border text-left transition relative ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500 font-bold'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{m.name.split(' ')[0]}</span>
                          {isToday && (
                            <span className="text-[8px] uppercase font-bold tracking-wider px-1 py-0.2 rounded-full bg-amber-600 text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-normal mt-0.5">{m.days}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Decade Banner & Meditation Accordion */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-100/40 dark:bg-neutral-900/40 border border-amber-200/70 dark:border-neutral-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          Decade {activeDecadeIndex + 1} of 5
                        </span>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-amber-900/90 dark:text-amber-300 font-semibold">
                          🕊️ Fruit: {currentDecade.fruit}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                        {currentDecade.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setShowMeditation(!showMeditation)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center space-x-1 ${
                          showMeditation
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{showMeditation ? 'Hide Reflection' : 'Scripture & Meditation'}</span>
                      </button>

                      <button
                        onClick={() => handleSpeakPrayer(
                          `${currentDecade.title}. Fruit: ${currentDecade.fruit}. ${currentDecade.scripture}. ${currentDecade.meditation}`,
                          'en-US',
                          'decade_meditation'
                        )}
                        className="p-1.5 rounded-lg text-xs bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-amber-50 transition flex items-center space-x-1"
                        title="Listen to meditation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlayingAudio && playingPrayerKey === 'decade_meditation' ? 'Listening...' : 'Audio'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Scripture & Meditation */}
                  {showMeditation && (
                    <div className="pt-2 border-t border-amber-200/50 dark:border-neutral-800 space-y-2 animate-fadeIn">
                      <blockquote className="text-xs sm:text-sm font-serif italic text-neutral-700 dark:text-neutral-300 border-l-2 border-amber-600 pl-3">
                        "{currentDecade.scripture}"
                      </blockquote>
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300">
                        <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Holy Meditation:</strong>
                        {currentDecade.meditation}
                      </div>
                    </div>
                  )}
                </div>

                {/* VISUAL DECADE BEADS TRACKER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1">
                      <span>{beadIndex === 0 ? '⭐' : beadIndex === 11 ? '✨' : '📿'}</span>
                      <span>{currentBeadPrayer.beadName}</span>
                    </span>
                    <span className="font-mono text-[11px] text-amber-800 dark:text-amber-400 font-bold">
                      Bead {beadIndex === 0 ? 'OF' : beadIndex === 11 ? 'GB' : `${beadIndex}/10`} (Step {beadIndex + 1} of 12)
                    </span>
                  </div>

                  {/* Beads Row */}
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 overflow-x-auto gap-1 shadow-inner">
                    {/* Our Father Bead */}
                    <button
                      onClick={() => {
                        speechService.stop();
                        setIsPlayingAudio(false);
                        setPlayingPrayerKey(null);
                        setBeadIndex(0);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition transform shrink-0 flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                        beadIndex === 0
                          ? 'bg-amber-600 border-amber-600 text-white ring-4 ring-amber-400/50 scale-110 shadow-md'
                          : beadIndex > 0
                          ? 'bg-amber-200 border-amber-400 text-amber-900 dark:bg-amber-800 dark:border-amber-600 dark:text-amber-100'
                          : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-amber-400'
                      }`}
                      title="Our Father Bead"
                    >
                      {beadIndex > 0 ? <Check className="w-3.5 h-3.5" /> : 'OF'}
                    </button>

                    <div className="w-2 sm:w-3 h-0.5 bg-neutral-300 dark:bg-neutral-700 shrink-0" />

                    {/* 10 Hail Mary Beads */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                      const isDone = beadIndex > num;
                      const isCurrent = beadIndex === num;
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            speechService.stop();
                            setIsPlayingAudio(false);
                            setPlayingPrayerKey(null);
                            setBeadIndex(num);
                          }}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border transition transform shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-mono ${
                            isCurrent
                              ? 'bg-amber-600 border-amber-600 text-white ring-4 ring-amber-400/50 scale-115 shadow-md font-bold'
                              : isDone
                              ? 'bg-amber-300 border-amber-400 text-amber-900 dark:bg-amber-800 dark:border-amber-600 dark:text-amber-100'
                              : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-amber-400'
                          }`}
                          title={`Hail Mary Bead #${num}`}
                        >
                          {isDone ? <Check className="w-3 h-3" /> : num}
                        </button>
                      );
                    })}

                    <div className="w-2 sm:w-3 h-0.5 bg-neutral-300 dark:bg-neutral-700 shrink-0" />

                    {/* Glory Be Bead */}
                    <button
                      onClick={() => {
                        speechService.stop();
                        setIsPlayingAudio(false);
                        setPlayingPrayerKey(null);
                        setBeadIndex(11);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition transform shrink-0 flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                        beadIndex === 11
                          ? 'bg-amber-600 border-amber-600 text-white ring-4 ring-amber-400/50 scale-110 shadow-md'
                          : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:border-amber-400'
                      }`}
                      title="Glory Be & Fatima Prayer"
                    >
                      GB
                    </button>
                  </div>
                </div>

                {/* THE PRAYER CARD (HERO ELEMENT: CLEAR, READABLE TEXT DIRECTLY IN VIEW) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-[#1f1d19] border-2 border-amber-400/90 dark:border-amber-600/70 shadow-md space-y-3">
                  {/* Card Header: Title + Language Switcher + Audio */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 dark:border-neutral-800 pb-2.5">
                    <div>
                      <h4 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                        <span>{currentBeadPrayer.type === 'single' ? currentBeadPrayer.prayer.title : currentBeadPrayer.beadName}</span>
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-400 italic font-serif">
                        {currentBeadPrayer.type === 'single' ? currentBeadPrayer.prayer.latinTitle : currentBeadPrayer.beadSubtitle}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Language Switcher Chips */}
                      <div className="flex items-center bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] font-semibold">
                        <Globe className="w-3 h-3 text-neutral-400 ml-1 mr-0.5" />
                        {ROSARY_LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => handleSetLang(lang.id)}
                            className={`px-2 py-0.5 rounded-md transition ${
                              rosaryLang === lang.id
                                ? 'bg-amber-600 text-white shadow-xs font-bold'
                                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                            title={lang.label}
                          >
                            {lang.short}
                          </button>
                        ))}
                      </div>

                      {/* Audio Button */}
                      <button
                        onClick={() => {
                          const textToSpeak = currentBeadPrayer.type === 'single'
                            ? currentBeadPrayer.prayer.text
                            : `${currentBeadPrayer.firstPrayer.text} ${currentBeadPrayer.secondPrayer.text}`;
                          const speechLang = currentBeadPrayer.type === 'single'
                            ? currentBeadPrayer.prayer.speechLang
                            : currentBeadPrayer.firstPrayer.speechLang;
                          handleSpeakPrayer(textToSpeak, speechLang, `bead_${beadIndex}`);
                        }}
                        className={`p-1.5 rounded-lg text-xs border transition flex items-center space-x-1 ${
                          isPlayingAudio && playingPrayerKey === `bead_${beadIndex}`
                            ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:bg-amber-50 dark:hover:bg-neutral-700'
                        }`}
                        title="Recite aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {isPlayingAudio && playingPrayerKey === `bead_${beadIndex}` ? 'Listening...' : 'Audio'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Prayer Body: Both Hail Mary & Holy Mary clearly visible */}
                  {currentBeadPrayer.type === 'single' ? (
                    <div className="space-y-2">
                      {beadIndex >= 1 && beadIndex <= 10 && (
                        <div className="inline-block px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-[11px] font-semibold">
                          Decade Bead {beadIndex} of 10
                        </div>
                      )}
                      <p className="font-serif text-sm sm:text-base leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line select-text font-normal">
                        {currentBeadPrayer.prayer.text}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 divide-y divide-amber-200/70 dark:divide-neutral-800">
                      {/* 1. Glory Be */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-amber-900 dark:text-amber-300">
                            1. {currentBeadPrayer.firstPrayer.title}
                          </h4>
                          {currentBeadPrayer.firstPrayer.latinTitle && (
                            <span className="text-xs italic text-neutral-500 font-serif">
                              {currentBeadPrayer.firstPrayer.latinTitle}
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-sm sm:text-base leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line select-text">
                          {currentBeadPrayer.firstPrayer.text}
                        </p>
                      </div>

                      {/* 2. Fatima Prayer */}
                      <div className="pt-2.5 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-amber-900 dark:text-amber-300">
                            2. {currentBeadPrayer.secondPrayer.title}
                          </h4>
                          {currentBeadPrayer.secondPrayer.latinTitle && (
                            <span className="text-xs italic text-neutral-500 font-serif">
                              {currentBeadPrayer.secondPrayer.latinTitle}
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-sm sm:text-base leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line select-text">
                          {currentBeadPrayer.secondPrayer.text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* BIG PRIMARY NAVIGATION BUTTONS: Move to next bead with clear prayer label */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleResetBeads}
                      className="px-2.5 sm:px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center space-x-1 transition"
                      title="Reset decade back to Our Father"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button
                      onClick={handlePrevBead}
                      disabled={beadIndex === 0 && activeDecadeIndex === 0}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center space-x-1 transition ${
                        beadIndex > 0 || activeDecadeIndex > 0
                          ? 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          : 'border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev Bead</span>
                    </button>
                  </div>

                  {/* Primary Next Bead Button */}
                  <button
                    onClick={handleNextBead}
                    className="flex-1 max-w-md py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-md transition transform active:scale-98 flex items-center justify-center space-x-1.5"
                  >
                    <span>{getNextBeadLabel()}</span>
                  </button>
                </div>

                {/* Decades Pagination Switcher */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      speechService.stop();
                      setIsPlayingAudio(false);
                      setPlayingPrayerKey(null);
                      if (activeDecadeIndex > 0) {
                        setActiveDecadeIndex(activeDecadeIndex - 1);
                        setBeadIndex(0);
                      }
                    }}
                    disabled={activeDecadeIndex === 0}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      activeDecadeIndex > 0
                        ? 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        : 'border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev Decade</span>
                  </button>

                  <div className="flex space-x-1.5">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          speechService.stop();
                          setIsPlayingAudio(false);
                          setPlayingPrayerKey(null);
                          setActiveDecadeIndex(idx);
                          setBeadIndex(0);
                        }}
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition ${
                          activeDecadeIndex === idx
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      speechService.stop();
                      setIsPlayingAudio(false);
                      setPlayingPrayerKey(null);
                      if (activeDecadeIndex < 4) {
                        setActiveDecadeIndex(activeDecadeIndex + 1);
                        setBeadIndex(0);
                      }
                    }}
                    disabled={activeDecadeIndex === 4}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                      activeDecadeIndex < 4
                        ? 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        : 'border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                    }`}
                  >
                    <span>Next Decade</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Divine Mercy Chaplet */}
        {activeTab === 'divine_mercy' && divineMercyPrayer && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-neutral-900/40 border border-amber-200/80 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-neutral-100">
                  {divineMercyPrayer.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {divineMercyPrayer.instructions}
                </p>
              </div>

              <button
                onClick={() => handleSpeakPrayer(divineMercyPrayer.content.map(c => `${c.section}. ${c.text}`).join(' '))}
                className="p-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center space-x-1 shadow transition"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingAudio ? 'Listening...' : 'Audio'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {divineMercyPrayer.content.map((sec, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5"
                >
                  <h4 className="font-semibold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                    {sec.section}
                  </h4>
                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                    {sec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Traditional Catholic Prayers */}
        {activeTab === 'traditional' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Daily', 'Marian', 'Protection', 'Eucharistic', 'Penitential'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPrayerCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    prayerCategory === cat
                      ? 'bg-amber-700 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Prayers' : cat}
                </button>
              ))}
            </div>

            {/* Prayers List */}
            <div className="space-y-3">
              {filteredTraditionalPrayers.map((prayer) => (
                <div
                  key={prayer.id}
                  className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/30 space-y-2 hover:border-amber-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
                        {prayer.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-neutral-700 text-amber-800 dark:text-amber-300">
                        {prayer.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSpeakPrayer(`${prayer.title}. ${prayer.text}`)}
                      className="p-1.5 rounded-lg text-xs bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 hover:bg-amber-50 transition flex items-center space-x-1"
                      title="Listen aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio</span>
                    </button>
                  </div>

                  {prayer.instructions && (
                    <p className="text-xs text-amber-800 dark:text-amber-400 italic">
                      {prayer.instructions}
                    </p>
                  )}

                  <p className="font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
                    {prayer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

