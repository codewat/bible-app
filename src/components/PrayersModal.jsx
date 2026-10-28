import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Volume2, Sparkles, ChevronRight, ChevronLeft, 
  RotateCcw, Check, BookOpen, Heart, Shield,
  Play, Pause, Square, SkipForward, SkipBack
} from 'lucide-react';
import { 
  ROSARY_MYSTERIES, 
  buildRosarySequence,
  COMMON_PRAYERS, 
  TRADITIONAL_PRAYERS, 
  getTodaysMysteryKey 
} from '../data/prayers';
import { speechService } from '../utils/speech';

const ROSARY_SECTIONS = [
  { id: 'intro', label: 'Opening Prayers', icon: '✝️', startIndex: 0, endIndex: 5 },
  { id: 'dec_0', label: '1st Decade', icon: '1', startIndex: 6, endIndex: 18 },
  { id: 'dec_1', label: '2nd Decade', icon: '2', startIndex: 19, endIndex: 31 },
  { id: 'dec_2', label: '3rd Decade', icon: '3', startIndex: 32, endIndex: 44 },
  { id: 'dec_3', label: '4th Decade', icon: '4', startIndex: 45, endIndex: 57 },
  { id: 'dec_4', label: '5th Decade', icon: '5', startIndex: 58, endIndex: 70 },
  { id: 'concluding', label: 'Closing Prayers', icon: '👑', startIndex: 71, endIndex: 72 },
];

export default function PrayersModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('rosary'); // 'rosary' | 'divine_mercy' | 'traditional'
  
  // Rosary State: Complete continuous sequence starting with the Apostles' Creed
  const [selectedMysteryKey, setSelectedMysteryKey] = useState(getTodaysMysteryKey());
  const rosarySequence = useMemo(() => buildRosarySequence(selectedMysteryKey), [selectedMysteryKey]);
  const [stepIndex, setStepIndex] = useState(0); // 0 = The Apostles' Creed
  const [isAudioRunning, setIsAudioRunning] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);

  // Traditional Prayers State
  const [selectedPrayerId, setSelectedPrayerId] = useState(null);
  const [prayerCategory, setPrayerCategory] = useState('ALL');

  // Keep speechService state in sync
  useEffect(() => {
    const unsubscribe = speechService.addStateListener((state) => {
      setIsAudioRunning(state.isPlaying);
      setIsAudioPaused(state.isPaused);
    });
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  if (!isOpen) return null;

  const currentStep = rosarySequence[stepIndex] || rosarySequence[0];
  const currentMystery = ROSARY_MYSTERIES[selectedMysteryKey];
  const currentSection = ROSARY_SECTIONS.find(
    s => stepIndex >= s.startIndex && stepIndex <= s.endIndex
  ) || ROSARY_SECTIONS[0];

  // Extract beads for the active section (Opening, Decade 1-5, or Closing)
  const currentSectionSteps = rosarySequence.slice(
    currentSection.startIndex, 
    currentSection.endIndex + 1
  );

  // Starts continuous audio from given index (or current step)
  const handleStartRosary = (startIdx = null) => {
    speechService.stop();
    const targetIdx = typeof startIdx === 'number' ? startIdx : stepIndex;
    setStepIndex(targetIdx);
    setIsAudioRunning(true);
    setIsAudioPaused(false);

    const items = rosarySequence.map(s => ({ text: s.speechText, lang: 'en-US' }));
    speechService.playSequence(items, targetIdx, (item, idx) => {
      setStepIndex(idx);
    });
  };

  const handlePauseResume = () => {
    if (isAudioPaused) {
      speechService.resume();
      setIsAudioPaused(false);
    } else {
      speechService.pause();
      setIsAudioPaused(true);
    }
  };

  const handleStopAudio = () => {
    speechService.stop();
    setIsAudioRunning(false);
    setIsAudioPaused(false);
  };

  const handleNextStep = () => {
    if (isAudioRunning) {
      speechService.next();
    } else {
      setStepIndex(prev => Math.min(prev + 1, rosarySequence.length - 1));
    }
  };

  const handlePrevStep = () => {
    if (isAudioRunning) {
      speechService.prev();
    } else {
      setStepIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const handleJumpToStep = (idx) => {
    setStepIndex(idx);
    if (isAudioRunning) {
      speechService.jumpTo(idx);
    }
  };

  const handleRestartRosary = () => {
    handleStopAudio();
    setStepIndex(0);
  };

  const handleChangeMystery = (mKey) => {
    handleStopAudio();
    setSelectedMysteryKey(mKey);
    setStepIndex(0);
  };

  const handleClose = () => {
    handleStopAudio();
    onClose();
  };

  const handleSpeakPrayer = (text, lang = 'en-US') => {
    if (isAudioRunning) {
      handleStopAudio();
      return;
    }
    speechService.stop();
    speechService.speakSingleVerse({ text, lang });
  };
  const isPlayingAudio = isAudioRunning;

  const divineMercyPrayer = TRADITIONAL_PRAYERS.find(p => p.id === 'divine_mercy');

  const filteredTraditionalPrayers = TRADITIONAL_PRAYERS.filter(p => {
    if (p.id === 'divine_mercy') return false;
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            {/* Top Mystery Selection Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold uppercase tracking-wider">Select Mystery</span>
                <span>Today is {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(ROSARY_MYSTERIES).map(([key, mystery]) => {
                  const isToday = key === getTodaysMysteryKey();
                  const isSelected = selectedMysteryKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleChangeMystery(key)}
                      className={`relative p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 hover:border-amber-300'
                      }`}
                    >
                      {isToday && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-600 text-white">
                          Today
                        </span>
                      )}
                      <div className="font-bold text-xs truncate pr-10">{mystery.name}</div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{mystery.days}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* START ROSARY / Audio Control Deck */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-md">
              {!isAudioRunning ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📿</span>
                      <h3 className="font-bold text-base tracking-wide">
                        The Most Holy Rosary
                      </h3>
                    </div>
                    <p className="text-xs text-amber-100/90 mt-0.5">
                      {stepIndex === 0 
                        ? "Continuous recitation from the Apostles' Creed through all 5 decades" 
                        : `Step ${stepIndex + 1} of ${rosarySequence.length}: ${currentStep.stepTitle}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {stepIndex > 0 && (
                      <button
                        onClick={() => handleStartRosary(0)}
                        className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5"
                        title="Start over from Apostles' Creed"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Start at Creed</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleStartRosary(stepIndex)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-amber-950" />
                      <span>{stepIndex === 0 ? 'START ROSARY' : 'RESUME AUDIO'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-xs sm:text-sm truncate max-w-[220px] sm:max-w-md">
                        {isAudioPaused ? 'Paused: ' : 'Reciting: '} {currentStep.stepTitle}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-200 font-mono">
                      {stepIndex + 1} / {rosarySequence.length}
                    </span>
                  </div>

                  {/* Player controls */}
                  <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl backdrop-blur-xs">
                    <button
                      onClick={handlePrevStep}
                      disabled={stepIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition text-white"
                      title="Previous prayer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePauseResume}
                        className="px-4 py-2 rounded-xl bg-white text-amber-950 font-bold text-xs flex items-center space-x-1.5 hover:bg-amber-100 transition shadow"
                      >
                        {isAudioPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-amber-950" />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-amber-950" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleStopAudio}
                        className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
                        title="Stop audio recitation"
                      >
                        <Square className="w-4 h-4 fill-white" />
                      </button>
                    </div>

                    <button
                      onClick={handleNextStep}
                      disabled={stepIndex >= rosarySequence.length - 1}
                      className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition text-white"
                      title="Next prayer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section Switcher Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {ROSARY_SECTIONS.map((sec) => {
                const isActive = currentSection.id === sec.id;
                const isPassed = stepIndex > sec.endIndex;
                return (
                  <button
                    key={sec.id}
                    onClick={() => handleJumpToStep(sec.startIndex)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1 shrink-0 ${
                      isActive
                        ? 'bg-amber-700 text-white font-bold shadow-xs'
                        : isPassed
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                    {isPassed && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Active Section Beads Track */}
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-neutral-900/50 border border-amber-200/80 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {currentSection.label} Beads
                </span>
                <span className="text-[11px] text-neutral-500">
                  Click any bead to jump or read prayer
                </span>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-2 pt-1 pb-1">
                {currentSectionSteps.map((step, localIdx) => {
                  const absoluteIdx = currentSection.startIndex + localIdx;
                  const isCurrent = absoluteIdx === stepIndex;
                  const isDone = absoluteIdx < stepIndex;

                  let beadStyle = 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300';
                  if (isCurrent) {
                    beadStyle = 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-400/40 font-bold scale-110 shadow-md';
                  } else if (isDone) {
                    beadStyle = 'bg-amber-100 dark:bg-amber-950/50 border-amber-400 text-amber-800 dark:text-amber-300';
                  }

                  const isLargeBead = step.beadType === 'our_father' || step.beadType === 'crucifix' || step.beadType === 'meditation' || step.beadType === 'concluding';

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleJumpToStep(absoluteIdx)}
                      className={`relative flex items-center justify-center rounded-full transition-all duration-200 select-none ${
                        isLargeBead ? 'px-3 py-1.5 h-8 min-w-[32px] text-xs rounded-xl' : 'w-7 h-7 text-[11px]'
                      } border ${beadStyle}`}
                      title={`${step.stepTitle} - ${step.subtitle}`}
                    >
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span>{step.beadLabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prayer Reading Hero Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/90 border-2 border-amber-300/80 dark:border-amber-600/40 shadow-sm space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                      {currentStep.subtitle}
                    </span>
                    {currentStep.latinTitle && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-neutral-800 text-amber-900 dark:text-amber-300 font-serif italic">
                        {currentStep.latinTitle}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-neutral-900 dark:text-neutral-100">
                    {currentStep.title}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    if (isAudioRunning) {
                      handleStopAudio();
                    } else {
                      handleStartRosary(stepIndex);
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs ${
                    isAudioRunning
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-white'
                      : 'bg-amber-700 hover:bg-amber-800 text-white'
                  }`}
                  title={isAudioRunning ? 'Stop audio' : 'Listen aloud'}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isAudioRunning ? 'Playing' : 'Audio'}</span>
                </button>
              </div>

              {/* Card Body - Structured Prayer Display */}
              <div className="space-y-4">
                {/* 1. Mystery Meditation Card */}
                {currentStep.isMeditation && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-neutral-800/60 border border-amber-200 dark:border-neutral-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        🕊️ Spiritual Fruit: {currentStep.fruit}
                      </span>
                    </div>

                    <blockquote className="p-3 border-l-4 border-amber-600 bg-neutral-50 dark:bg-neutral-800/40 rounded-r-xl italic font-serif text-sm text-neutral-800 dark:text-neutral-200">
                      "{currentStep.scripture}"
                    </blockquote>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Meditation</h4>
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
                        {currentStep.meditation}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Apostles' Creed (Starts with Sign of the Cross) */}
                {currentStep.id === 'intro_creed' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-neutral-800/50 border border-amber-200/80 dark:border-neutral-700 text-center">
                      <p className="font-serif italic font-semibold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                        ✝️ In the name of the Father, and of the Son, and of the Holy Ghost. Amen.
                      </p>
                    </div>

                    <div className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 space-y-2.5">
                      <p>
                        I believe in God, the Father Almighty, Creator of heaven and earth; and in Jesus Christ, His only Son, our Lord; who was conceived by the Holy Ghost, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried.
                      </p>
                      <p>
                        He descended into hell; the third day He arose again from the dead; He ascended into heaven, and sitteth at the right hand of God the Father Almighty; from thence He shall come to judge the living and the dead.
                      </p>
                      <p>
                        I believe in the Holy Ghost, the Holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Hail Mary (Separated Stanzas for responsive prayer) */}
                {currentStep.beadType === 'hail_mary' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-neutral-800/50 border border-amber-200/70 dark:border-neutral-700 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                        The Angelic Salutation (Leader)
                      </span>
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
                        Hail Mary, full of grace, the Lord is with thee; blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                        The Petition (Response)
                      </span>
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
                        Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Glory Be & Fatima Prayer (Decade Concluding Dual Prayer) */}
                {currentStep.isDual && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-neutral-800/50 border border-amber-200/70 dark:border-neutral-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          {currentStep.firstTitle}
                        </span>
                        <span className="text-[10px] italic font-serif text-neutral-500">
                          {currentStep.firstLatinTitle}
                        </span>
                      </div>
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
                        {currentStep.firstText}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          {currentStep.secondTitle}
                        </span>
                        <span className="text-[10px] italic font-serif text-neutral-500">
                          {currentStep.secondLatinTitle}
                        </span>
                      </div>
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100">
                        {currentStep.secondText}
                      </p>
                    </div>
                  </div>
                )}

                {/* 5. Standard Our Father / Other Steps */}
                {!currentStep.isMeditation && currentStep.id !== 'intro_creed' && currentStep.beadType !== 'hail_mary' && !currentStep.isDual && (
                  <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                    {currentStep.text}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Stepper & Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Progress: {stepIndex + 1} of {rosarySequence.length} prayers ({Math.round(((stepIndex + 1) / rosarySequence.length) * 100)}%)</span>
                <span>{currentSection.label}</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / rosarySequence.length) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleRestartRosary}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1"
                  title="Reset to Apostles' Creed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevStep}
                    disabled={stepIndex === 0}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    disabled={stepIndex >= rosarySequence.length - 1}
                    className="px-4 sm:px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>
                      {stepIndex < rosarySequence.length - 1
                        ? `Next: ${rosarySequence[stepIndex + 1].stepTitle}`
                        : 'Rosary Finished'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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

