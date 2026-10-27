import React, { useState } from 'react';
import { 
  X, Volume2, Sparkles, ChevronRight, ChevronLeft, 
  RotateCcw, Check, BookOpen, Heart, Shield 
} from 'lucide-react';
import { 
  ROSARY_MYSTERIES, 
  COMMON_PRAYERS, 
  TRADITIONAL_PRAYERS, 
  getTodaysMysteryKey 
} from '../data/prayers';
import { speechService } from '../utils/speech';

export default function PrayersModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('rosary'); // 'rosary' | 'divine_mercy' | 'traditional'
  
  // Rosary State
  const [selectedMysteryKey, setSelectedMysteryKey] = useState(getTodaysMysteryKey());
  const [activeDecadeIndex, setActiveDecadeIndex] = useState(0);
  const [beadIndex, setBeadIndex] = useState(0); // 0 = Our Father, 1..10 = Hail Marys, 11 = Glory Be & Fatima
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Traditional Prayers State
  const [selectedPrayerId, setSelectedPrayerId] = useState(null);
  const [prayerCategory, setPrayerCategory] = useState('ALL');

  if (!isOpen) return null;

  const currentMystery = ROSARY_MYSTERIES[selectedMysteryKey];
  const currentDecade = currentMystery.decades[activeDecadeIndex];

  const handleNextBead = () => {
    if (beadIndex < 11) {
      setBeadIndex(beadIndex + 1);
    } else {
      // Advance to next decade if available
      if (activeDecadeIndex < 4) {
        setActiveDecadeIndex(activeDecadeIndex + 1);
        setBeadIndex(0);
      }
    }
  };

  const handleResetBeads = () => {
    setBeadIndex(0);
  };

  const handleSpeakPrayer = (text) => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speechService.playSingleVerse({ text });
      setTimeout(() => setIsPlayingAudio(false), 12000);
    }
  };

  const handleClose = () => {
    speechService.stop();
    setIsPlayingAudio(false);
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Mystery Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(ROSARY_MYSTERIES).map((m) => {
                const isSelected = selectedMysteryKey === m.id;
                const isToday = getTodaysMysteryKey() === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMysteryKey(m.id);
                      setActiveDecadeIndex(0);
                      setBeadIndex(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {isToday && (
                      <span className="absolute -top-2 right-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-amber-600 text-white shadow-xs">
                        Today
                      </span>
                    )}
                    <p className="font-serif font-bold text-xs sm:text-sm">{m.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{m.days}</p>
                  </button>
                );
              })}
            </div>

            {/* Current Decade Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-100/30 dark:from-neutral-800 dark:via-neutral-800/80 dark:to-amber-950/20 border border-amber-200 dark:border-neutral-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Decade {activeDecadeIndex + 1} of 5 • {currentMystery.name}
                </span>

                <button
                  onClick={() => handleSpeakPrayer(`${currentDecade.title}. Fruit of the mystery: ${currentDecade.fruit}. ${currentDecade.scripture}. ${currentDecade.meditation}`)}
                  className="p-1.5 rounded-lg text-xs bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 hover:bg-amber-50 transition flex items-center space-x-1"
                  title="Listen aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? 'Listening...' : 'Audio'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                  {currentDecade.title}
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-1">
                  🕊️ Spiritual Fruit: {currentDecade.fruit}
                </p>
              </div>

              {/* Scripture & Meditation */}
              <blockquote className="text-xs sm:text-sm font-serif italic text-neutral-700 dark:text-neutral-300 border-l-3 border-amber-600 pl-3 leading-relaxed">
                "{currentDecade.scripture}"
              </blockquote>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/70 border border-amber-200/50 dark:border-neutral-700 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                  Holy Meditation:
                </span>
                {currentDecade.meditation}
              </div>

              {/* Interactive Rosary Beads Tracker */}
              <div className="pt-3 border-t border-amber-200/60 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Interactive Decade Beads:
                  </span>
                  <span className="text-xs font-mono text-amber-800 dark:text-amber-300 font-medium">
                    {beadIndex === 0 && 'Our Father bead'}
                    {beadIndex >= 1 && beadIndex <= 10 && `Hail Mary ${beadIndex}/10`}
                    {beadIndex === 11 && 'Glory Be & Fatima Prayer'}
                  </span>
                </div>

                {/* Beads Row */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 overflow-x-auto gap-1">
                  {/* Our Father Bead */}
                  <button
                    onClick={() => setBeadIndex(0)}
                    className={`w-7 h-7 rounded-full border-2 transition transform shrink-0 flex items-center justify-center font-bold text-[10px] ${
                      beadIndex === 0
                        ? 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-400 scale-110'
                        : beadIndex > 0
                        ? 'bg-amber-200 border-amber-400 text-amber-900'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400'
                    }`}
                    title="Our Father"
                  >
                    OF
                  </button>

                  <div className="w-2 h-0.5 bg-neutral-300 dark:bg-neutral-700 shrink-0" />

                  {/* 10 Hail Mary Beads */}
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                    const isDone = beadIndex > num;
                    const isCurrent = beadIndex === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setBeadIndex(num)}
                        className={`w-6 h-6 rounded-full border transition transform shrink-0 flex items-center justify-center text-[10px] font-mono ${
                          isCurrent
                            ? 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-400 scale-115'
                            : isDone
                            ? 'bg-amber-300 border-amber-400 text-amber-900 dark:bg-amber-800 dark:border-amber-600 dark:text-amber-100'
                            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500'
                        }`}
                        title={`Hail Mary #${num}`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : num}
                      </button>
                    );
                  })}

                  <div className="w-2 h-0.5 bg-neutral-300 dark:bg-neutral-700 shrink-0" />

                  {/* Glory Be Bead */}
                  <button
                    onClick={() => setBeadIndex(11)}
                    className={`w-7 h-7 rounded-full border-2 transition transform shrink-0 flex items-center justify-center font-bold text-[10px] ${
                      beadIndex === 11
                        ? 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-400 scale-110'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400'
                    }`}
                    title="Glory Be & Fatima Prayer"
                  >
                    GB
                  </button>
                </div>

                {/* Bead Advance Button */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={handleResetBeads}
                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Decade</span>
                  </button>

                  <button
                    onClick={handleNextBead}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow transition transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <span>
                      {beadIndex === 11 
                        ? (activeDecadeIndex < 4 ? 'Next Decade →' : 'Finish Rosary ✨') 
                        : 'Next Bead →'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Decades Pagination Switcher */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
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
                      setActiveDecadeIndex(idx);
                      setBeadIndex(0);
                    }}
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition ${
                      activeDecadeIndex === idx
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
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

