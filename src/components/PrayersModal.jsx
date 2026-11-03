import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Volume2, Sparkles, ChevronRight, ChevronLeft, ChevronDown,
  RotateCcw, Check, BookOpen, Heart, Shield, Sliders,
  Play, Pause, Square, SkipForward, SkipBack
} from 'lucide-react';
import { 
  ROSARY_MYSTERIES, 
  buildRosarySequence,
  buildDivineMercySequence,
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

const DM_SECTIONS = [
  { id: 'intro', label: 'Opening Prayers', icon: '✝️', startIndex: 0, endIndex: 4 },
  { id: 'decade_1', label: '1st Decade', icon: '1', startIndex: 5, endIndex: 15 },
  { id: 'decade_2', label: '2nd Decade', icon: '2', startIndex: 16, endIndex: 26 },
  { id: 'decade_3', label: '3rd Decade', icon: '3', startIndex: 27, endIndex: 37 },
  { id: 'decade_4', label: '4th Decade', icon: '4', startIndex: 38, endIndex: 48 },
  { id: 'decade_5', label: '5th Decade', icon: '5', startIndex: 49, endIndex: 59 },
  { id: 'concluding', label: 'Closing Prayers', icon: '🕊️', startIndex: 60, endIndex: 63 },
];

export default function PrayersModal({ 
  isOpen, 
  onClose,
  onPrayerAudioSync,
  onRegisterPrayerControls 
}) {
  const [activeTab, setActiveTab] = useState('rosary'); // 'rosary' | 'divine_mercy' | 'traditional'
  
  // Rosary Manual Reading State: Mystery and bead currently displayed in the view below
  const [selectedMysteryKey, setSelectedMysteryKey] = useState(getTodaysMysteryKey());
  const rosarySequence = useMemo(() => buildRosarySequence(selectedMysteryKey), [selectedMysteryKey]);
  const [stepIndex, setStepIndex] = useState(0); // 0 = The Apostles' Creed

  // Rosary Audio Playback State (Completely independent from manual reading view)
  const [audioMysteryKey, setAudioMysteryKey] = useState(getTodaysMysteryKey());
  const audioRosarySequence = useMemo(() => buildRosarySequence(audioMysteryKey), [audioMysteryKey]);
  const [audioRosaryIndex, setAudioRosaryIndex] = useState(0);
  const [isRosaryActive, setIsRosaryActive] = useState(false);
  const [isRosaryPaused, setIsRosaryPaused] = useState(false);

  // Divine Mercy Manual Reading State
  const divineMercySequence = useMemo(() => buildDivineMercySequence(), []);
  const [dmStepIndex, setDmStepIndex] = useState(0);

  // Divine Mercy Audio Playback State (Completely independent from manual reading view)
  const [audioDmIndex, setAudioDmIndex] = useState(0);
  const [isDmActive, setIsDmActive] = useState(false);
  const [isDmPaused, setIsDmPaused] = useState(false);

  const [isSingleRunning, setIsSingleRunning] = useState(false);

  // Relaxing Voice & Cadence Settings
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(speechService.getSelectedVoiceURI() || '');
  const [rosaryRate, setRosaryRate] = useState(() => {
    try {
      return localStorage.getItem('catholic_bible_rosary_rate') || '0.85';
    } catch {
      return '0.85';
    }
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Traditional Prayers State
  const [selectedPrayerId, setSelectedPrayerId] = useState(null);
  const [prayerCategory, setPrayerCategory] = useState('ALL');

  // Restart confirmation states
  const [showRosaryRestartConfirm, setShowRosaryRestartConfirm] = useState(false);
  const [showDmRestartConfirm, setShowDmRestartConfirm] = useState(false);

  // Load voices and keep speechService state in sync
  useEffect(() => {
    const updateVoices = () => {
      const vList = speechService.getEnglishVoices();
      setAvailableVoices(vList);
      const currentURI = speechService.getSelectedVoiceURI();
      if (!currentURI && vList.length > 0) {
        const best = speechService.getBestEnglishVoice();
        if (best) {
          setSelectedVoiceURI(best.voiceURI);
          speechService.setSelectedVoiceURI(best.voiceURI);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    const unsubscribe = speechService.addStateListener((state) => {
      if (state.mode === 'prayer') {
        setIsRosaryPaused(Boolean(state.isPaused));
        setIsDmPaused(Boolean(state.isPaused));
      }
      if (!state.isPlaying) {
        setIsSingleRunning(false);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Sync prayer audio state to parent (for floating player bar on Bible screen)
  useEffect(() => {
    if (onPrayerAudioSync) {
      onPrayerAudioSync({
        isRosaryActive,
        isRosaryPaused,
        rosaryStepTitle: audioRosarySequence[audioRosaryIndex]?.stepTitle || 'The Apostles\' Creed',
        audioRosaryIndex,
        totalRosarySteps: audioRosarySequence.length,
        isDmActive,
        isDmPaused,
        dmStepTitle: divineMercySequence[audioDmIndex]?.stepTitle || 'Opening Prayers',
        audioDmIndex,
        totalDmSteps: divineMercySequence.length,
      });
    }
  }, [
    isRosaryActive,
    isRosaryPaused,
    audioRosaryIndex,
    audioMysteryKey,
    isDmActive,
    isDmPaused,
    audioDmIndex,
    audioRosarySequence,
    divineMercySequence,
    onPrayerAudioSync,
  ]);

  // Expose prayer audio controls to parent (for floating player bar on Bible screen)
  useEffect(() => {
    if (onRegisterPrayerControls) {
      onRegisterPrayerControls({
        playRosary: handlePlayRosaryAudio,
        pauseResumeRosary: handlePauseResumeRosary,
        prevRosary: handleAudioPrevRosary,
        nextRosary: handleAudioNextRosary,
        restartRosary: handleRestartRosaryConfirmed,
        playDm: handlePlayDivineMercyAudio,
        pauseResumeDm: handlePauseResumeDm,
        prevDm: handleAudioPrevDm,
        nextDm: handleAudioNextDm,
        restartDm: handleRestartDmConfirmed,
        stopAudio: handleStopAudio,
        pauseAudio: () => {
          if (isRosaryActive && !isRosaryPaused) {
            if (speechService.mode === 'prayer') {
              speechService.pause();
            }
            setIsRosaryPaused(true);
          }
          if (isDmActive && !isDmPaused) {
            if (speechService.mode === 'prayer') {
              speechService.pause();
            }
            setIsDmPaused(true);
          }
        },
      });
    }
  }, [
    isRosaryActive,
    isRosaryPaused,
    audioRosaryIndex,
    isDmActive,
    isDmPaused,
    audioDmIndex,
    audioRosarySequence,
    divineMercySequence,
    onRegisterPrayerControls,
  ]);

  const isRosaryRunning = isRosaryActive && !isRosaryPaused;
  const isDmRunning = isDmActive && !isDmPaused;

  // Rosary Active Step & Section Helpers
  const currentStep = rosarySequence[stepIndex] || rosarySequence[0];
  const currentMystery = ROSARY_MYSTERIES[selectedMysteryKey];
  const currentSection = ROSARY_SECTIONS.find(
    s => stepIndex >= s.startIndex && stepIndex <= s.endIndex
  ) || ROSARY_SECTIONS[0];
  const currentSectionSteps = rosarySequence.slice(
    currentSection.startIndex, 
    currentSection.endIndex + 1
  );

  // Divine Mercy Active Step & Section Helpers
  const currentDmStep = divineMercySequence[dmStepIndex] || divineMercySequence[0];
  const currentDmSection = DM_SECTIONS.find(
    s => dmStepIndex >= s.startIndex && dmStepIndex <= s.endIndex
  ) || DM_SECTIONS[0];
  const currentDmSectionSteps = divineMercySequence.slice(
    currentDmSection.startIndex,
    currentDmSection.endIndex + 1
  );

  // Starts continuous Rosary audio from given index (or current step) with relaxing voice & prayerful pace
  // Starts or continues continuous Rosary audio reciting the full Rosary independently
  const handlePlayRosaryAudio = (startIdx = null) => {
    speechService.stop();
    const targetIdx = typeof startIdx === 'number' ? startIdx : audioRosaryIndex;
    setAudioRosaryIndex(targetIdx);
    setIsRosaryActive(true);
    setIsRosaryPaused(false);
    setIsDmActive(false);
    setIsDmPaused(false);
    setIsSingleRunning(false);

    const parsedRate = parseFloat(rosaryRate) || 0.85;
    speechService.setRate(parsedRate);
    if (selectedVoiceURI) {
      speechService.setSelectedVoiceURI(selectedVoiceURI);
    }

    const items = audioRosarySequence.map(s => ({ text: s.speechText, lang: 'en-US' }));
    speechService.playSequence(
      items, 
      targetIdx, 
      (item, idx) => {
        // Only update audio position. NEVER touch reading view stepIndex!
        setAudioRosaryIndex(idx);
      }, 
      { rate: parsedRate, voiceURI: selectedVoiceURI },
      () => {
        setIsRosaryActive(false);
        setIsRosaryPaused(false);
      }
    );
  };

  // Starts or continues continuous Divine Mercy audio reciting full chaplet independently
  const handlePlayDivineMercyAudio = (startIdx = null) => {
    speechService.stop();
    const targetIdx = typeof startIdx === 'number' ? startIdx : audioDmIndex;
    setAudioDmIndex(targetIdx);
    setIsDmActive(true);
    setIsDmPaused(false);
    setIsRosaryActive(false);
    setIsRosaryPaused(false);
    setIsSingleRunning(false);

    const parsedRate = parseFloat(rosaryRate) || 0.85;
    speechService.setRate(parsedRate);
    if (selectedVoiceURI) {
      speechService.setSelectedVoiceURI(selectedVoiceURI);
    }

    const items = divineMercySequence.map(s => ({ text: s.speechText, lang: 'en-US' }));
    speechService.playSequence(
      items, 
      targetIdx, 
      (item, idx) => {
        // Only update audio position. NEVER touch reading view dmStepIndex!
        setAudioDmIndex(idx);
      }, 
      { rate: parsedRate, voiceURI: selectedVoiceURI },
      () => {
        setIsDmActive(false);
        setIsDmPaused(false);
      }
    );
  };

  const handleTestVoice = () => {
    const parsedRate = parseFloat(rosaryRate) || 0.85;
    speechService.previewVoice(selectedVoiceURI, parsedRate);
  };

  const handleRestartRosaryConfirmed = () => {
    setShowRosaryRestartConfirm(false);
    setAudioRosaryIndex(0);
    setIsRosaryPaused(false);
    handlePlayRosaryAudio(0);
  };

  const handleRestartDmConfirmed = () => {
    setShowDmRestartConfirm(false);
    setAudioDmIndex(0);
    setIsDmPaused(false);
    handlePlayDivineMercyAudio(0);
  };

  const handlePauseResumeRosary = () => {
    if (!isRosaryActive) {
      handlePlayRosaryAudio(audioRosaryIndex);
      return;
    }
    if (isRosaryPaused) {
      // User wants to PLAY/RESUME Rosary
      if (speechService.mode === 'prayer') {
        speechService.resume();
        setIsRosaryPaused(false);
      } else {
        // Scripture audio was running or active in speechService
        // Re-launch Rosary recitation cleanly from current audioRosaryIndex
        handlePlayRosaryAudio(audioRosaryIndex);
      }
    } else {
      // User wants to PAUSE Rosary
      if (speechService.mode === 'prayer') {
        speechService.pause();
      }
      setIsRosaryPaused(true);
    }
  };

  const handlePauseResumeDm = () => {
    if (!isDmActive) {
      handlePlayDivineMercyAudio(audioDmIndex);
      return;
    }
    if (isDmPaused) {
      // User wants to PLAY/RESUME Divine Mercy
      if (speechService.mode === 'prayer') {
        speechService.resume();
        setIsDmPaused(false);
      } else {
        handlePlayDivineMercyAudio(audioDmIndex);
      }
    } else {
      // User wants to PAUSE Divine Mercy
      if (speechService.mode === 'prayer') {
        speechService.pause();
      }
      setIsDmPaused(true);
    }
  };

  const handleAudioNextRosary = () => {
    const nextIdx = Math.min(audioRosaryIndex + 1, audioRosarySequence.length - 1);
    if (nextIdx === audioRosaryIndex) return;
    setAudioRosaryIndex(nextIdx);
    setIsRosaryPaused(false);
    handlePlayRosaryAudio(nextIdx);
  };

  const handleAudioPrevRosary = () => {
    const prevIdx = Math.max(audioRosaryIndex - 1, 0);
    if (prevIdx === audioRosaryIndex) return;
    setAudioRosaryIndex(prevIdx);
    setIsRosaryPaused(false);
    handlePlayRosaryAudio(prevIdx);
  };

  const handleAudioNextDm = () => {
    const nextIdx = Math.min(audioDmIndex + 1, divineMercySequence.length - 1);
    if (nextIdx === audioDmIndex) return;
    setAudioDmIndex(nextIdx);
    setIsDmPaused(false);
    handlePlayDivineMercyAudio(nextIdx);
  };

  const handleAudioPrevDm = () => {
    const prevIdx = Math.max(audioDmIndex - 1, 0);
    if (prevIdx === audioDmIndex) return;
    setAudioDmIndex(prevIdx);
    setIsDmPaused(false);
    handlePlayDivineMercyAudio(prevIdx);
  };

  const handleStopAudio = () => {
    speechService.stop();
    setIsRosaryActive(false);
    setIsRosaryPaused(false);
    setIsDmActive(false);
    setIsDmPaused(false);
    setIsSingleRunning(false);
  };

  // Manual Reading Navigation (Below the Audio Deck - completely uncoupled from audio)
  const handleNextManualStep = () => {
    setStepIndex(prev => Math.min(prev + 1, rosarySequence.length - 1));
  };

  const handlePrevManualStep = () => {
    setStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleJumpToStep = (idx) => {
    setStepIndex(idx);
  };

  const handleNextManualDm = () => {
    setDmStepIndex(prev => Math.min(prev + 1, divineMercySequence.length - 1));
  };

  const handlePrevManualDm = () => {
    setDmStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleJumpToDmStep = (idx) => {
    setDmStepIndex(idx);
  };

  // Switching mysteries does NOT stop audio! Audio continues uninterrupted.
  const handleChangeMystery = (mKey) => {
    setSelectedMysteryKey(mKey);
    setStepIndex(0);
    // If audio is not running, also set audio mystery so starting audio will use the chosen mystery
    if (!isRosaryActive) {
      setAudioMysteryKey(mKey);
      setAudioRosaryIndex(0);
    }
  };

  const handleClose = () => {
    // Closing modal does NOT stop audio! Audio continues on the Bible screen.
    onClose();
  };

  // Pure prayer speech without titles
  const handleSpeakPrayer = (text, lang = 'en-US') => {
    if (isSingleRunning || isRosaryActive || isDmActive) {
      handleStopAudio();
      return;
    }
    speechService.stop();
    setIsSingleRunning(true);
    speechService.speakSingleVerse({ text, lang }, { mode: 'prayer' });
  };

  const divineMercyPrayer = TRADITIONAL_PRAYERS.find(p => p.id === 'divine_mercy');

  const filteredTraditionalPrayers = TRADITIONAL_PRAYERS.filter(p => {
    if (p.id === 'divine_mercy') return false;
    if (prayerCategory !== 'ALL' && p.category !== prayerCategory) return false;
    return true;
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn ${!isOpen ? 'hidden pointer-events-none' : ''}`}>
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

        {/* Persistent Audio Mini-Player when Rosary Audio is playing on other tabs */}
        {isRosaryActive && activeTab !== 'rosary' && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white flex items-center justify-between text-xs border-b border-amber-600/30 shadow-sm shrink-0">
            <div className="flex items-center space-x-2 truncate mr-2">
              <span className="text-base select-none">📿</span>
              <span className="font-bold truncate">Rosary Audio:</span>
              <span className="text-amber-100/90 truncate font-serif">
                {audioRosarySequence[audioRosaryIndex]?.stepTitle}
              </span>
              {!isRosaryPaused ? (
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Reciting</span>
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200 shrink-0 font-medium">
                  ⏸ Paused
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAudioPrevRosary}
                disabled={audioRosaryIndex === 0}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition cursor-pointer"
                title="Previous audio prayer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePauseResumeRosary}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                {!isRosaryPaused ? (
                  <>
                    <Pause className="w-3 h-3 fill-amber-950" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-amber-950" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAudioNextRosary}
                disabled={audioRosaryIndex >= audioRosarySequence.length - 1}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition cursor-pointer"
                title="Next audio prayer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleStopAudio}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Stop audio"
              >
                <Square className="w-3 h-3 fill-white" />
              </button>
            </div>
          </div>
        )}

        {/* Persistent Audio Mini-Player when Divine Mercy Audio is playing on other tabs */}
        {isDmActive && activeTab !== 'divine_mercy' && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-red-800 via-rose-900 to-amber-900 text-white flex items-center justify-between text-xs border-b border-rose-600/30 shadow-sm shrink-0">
            <div className="flex items-center space-x-2 truncate mr-2">
              <span className="text-base select-none">✝️</span>
              <span className="font-bold truncate">Divine Mercy Audio:</span>
              <span className="text-rose-100/90 truncate font-serif">
                {divineMercySequence[audioDmIndex]?.stepTitle}
              </span>
              {!isDmPaused ? (
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Reciting</span>
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200 shrink-0 font-medium">
                  ⏸ Paused
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAudioPrevDm}
                disabled={audioDmIndex === 0}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition cursor-pointer"
                title="Previous audio prayer"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePauseResumeDm}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold flex items-center space-x-1 transition cursor-pointer"
              >
                {!isDmPaused ? (
                  <>
                    <Pause className="w-3 h-3 fill-amber-950" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-amber-950" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAudioNextDm}
                disabled={audioDmIndex >= divineMercySequence.length - 1}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white transition cursor-pointer"
                title="Next audio prayer"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleStopAudio}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Stop audio"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            </div>
          </div>
        )}

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

            {/* START ROSARY / Audio Control Deck (Completely separate from reading list below) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-md">
              {!isRosaryActive ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📿</span>
                      <h3 className="font-bold text-base tracking-wide">
                        The Most Holy Rosary Audio
                      </h3>
                    </div>
                    <p className="text-xs text-amber-100/90 mt-0.5">
                      Continuous audio recitation • Apostles' Creed through all 5 decades ({ROSARY_MYSTERIES[audioMysteryKey]?.title})
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlayRosaryAudio(0)}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-amber-950" />
                    <span>START ROSARY</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📿</span>
                        <h3 className="font-bold text-sm sm:text-base tracking-wide">
                          The Most Holy Rosary Audio
                        </h3>
                        {!isRosaryPaused ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Reciting Audio</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/30 text-amber-200 text-[10px] font-semibold">
                            ⏸ Audio Paused
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-100/90 mt-0.5 truncate max-w-sm sm:max-w-md">
                        Step {audioRosaryIndex + 1} of {audioRosarySequence.length}: {audioRosarySequence[audioRosaryIndex]?.stepTitle}
                      </p>
                    </div>

                    {/* Action buttons: Restart, Previous, Pause/Resume, Next, Stop */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                      {/* 1. Restart Button */}
                      <button
                        type="button"
                        onClick={() => setShowRosaryRestartConfirm(true)}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Restart Rosary audio from beginning"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </button>

                      {/* 2. Previous Button (with label) */}
                      <button
                        type="button"
                        onClick={handleAudioPrevRosary}
                        disabled={audioRosaryIndex === 0}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Previous audio prayer"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      {/* 3. Pause / Resume Button */}
                      <button
                        type="button"
                        onClick={handlePauseResumeRosary}
                        className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                      >
                        {!isRosaryPaused ? (
                          <>
                            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-950" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-950" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>

                      {/* 4. Next Button */}
                      <button
                        type="button"
                        onClick={handleAudioNextRosary}
                        disabled={audioRosaryIndex >= audioRosarySequence.length - 1}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Next audio prayer"
                      >
                        <span>Next</span>
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>

                      {/* 5. Stop Button */}
                      {isRosaryActive && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                          title="Stop audio"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Prompt when Restart is clicked */}
                  {showRosaryRestartConfirm && (
                    <div className="p-3 rounded-xl bg-black/40 border border-amber-400/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 animate-fadeIn">
                      <div className="flex items-center space-x-2 text-xs text-amber-100">
                        <RotateCcw className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="font-semibold">Do you want to start from the beginning?</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleRestartRosaryConfirmed}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition shadow-xs cursor-pointer"
                        >
                          Yes, Restart
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRosaryRestartConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice & Pacing Settings Accordion */}
              <div className="pt-2.5 mt-2.5 border-t border-white/15">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-black/25 hover:bg-black/35 text-amber-200 hover:text-white transition text-[11px] font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>🕊️ Relaxing Voice & Pace</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showVoiceSettings ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-200/90 font-medium">
                    <span className="hidden sm:inline">Cadence:</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/20 text-amber-300 font-mono">
                      {rosaryRate === '0.85' ? '0.85x (Gentle)' : rosaryRate === '0.78' ? '0.78x (Deep)' : `${rosaryRate}x`}
                    </span>
                  </div>
                </div>

                {showVoiceSettings && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/35 border border-white/10 space-y-3 animate-fadeIn text-xs">
                    {/* Voice Selector */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
                        <span>Select Voice on your Device:</span>
                        <button
                          type="button"
                          onClick={handleTestVoice}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-[10px] transition flex items-center space-x-1"
                          title="Preview prayer in this voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>▶ Test Voice</span>
                        </button>
                      </div>
                      <select
                        value={selectedVoiceURI}
                        onChange={(e) => {
                          setSelectedVoiceURI(e.target.value);
                          speechService.setSelectedVoiceURI(e.target.value);
                        }}
                        className="w-full p-2 rounded-xl bg-neutral-900 border border-amber-500/40 text-neutral-100 text-xs focus:ring-2 focus:ring-amber-400 outline-hidden font-sans"
                      >
                        {availableVoices.length === 0 ? (
                          <option value="">Device Default Natural Voice</option>
                        ) : (
                          availableVoices.map((v) => (
                            <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                              {v.badge ? `${v.badge} • ${v.name}` : v.name}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-[10px] text-amber-200/70 italic">
                        Tip: Look for voices with "Natural", "Google", "Siri", "Jenny", "Samantha", or "Enhanced" for the most human-like, peaceful recitation.
                      </p>
                    </div>

                    {/* Cadence / Pacing Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-amber-200">
                        Prayer Cadence & Speed:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: '0.85', label: '🕊️ Gentle (0.85x)', sub: 'Calm & Reverent' },
                          { id: '0.78', label: '🕊️ Deep (0.78x)', sub: 'Meditative' },
                          { id: '1.0', label: 'Standard (1.0x)', sub: 'Brisk' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setRosaryRate(p.id);
                              try { localStorage.setItem('catholic_bible_rosary_rate', p.id); } catch {}
                              speechService.setRate(parseFloat(p.id));
                            }}
                            className={`p-2 rounded-xl border text-center transition ${
                              rosaryRate === p.id
                                ? 'bg-amber-400 text-amber-950 border-amber-400 font-bold shadow-sm'
                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                            }`}
                          >
                            <div className="text-[11px] font-bold">{p.label}</div>
                            <div className="text-[9px] opacity-80 mt-0.5">{p.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            <div 
              className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/90 border-2 border-amber-300/80 dark:border-amber-600/40 shadow-sm space-y-4"
            >
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
                  onClick={() => handleSpeakPrayer(currentStep.speechText || currentStep.text)}
                  className="p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs bg-amber-50 hover:bg-amber-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-neutral-700 cursor-pointer"
                  title="Listen to this prayer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
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
                  type="button"
                  onClick={() => setStepIndex(0)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                  title="Start reading from beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start at Beginning</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevManualStep}
                    disabled={stepIndex === 0}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextManualStep}
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
        {activeTab === 'divine_mercy' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
            {/* START DIVINE MERCY / Audio Control Deck (Completely separate from reading list below) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-red-800 via-rose-900 to-amber-900 text-white shadow-md">
              {!isDmActive ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">✝️</span>
                      <h3 className="font-bold text-base tracking-wide">
                        The Chaplet of the Divine Mercy Audio
                      </h3>
                    </div>
                    <p className="text-xs text-rose-100/90 mt-0.5">
                      Continuous recitation: 5 Decades (10x Sorrowful Passion each) • 3x Holy God
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlayDivineMercyAudio(0)}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-amber-950" />
                    <span>START DIVINE MERCY</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">✝️</span>
                        <h3 className="font-bold text-sm sm:text-base tracking-wide">
                          The Chaplet of the Divine Mercy Audio
                        </h3>
                        {!isDmPaused ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Reciting Audio</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/30 text-amber-200 text-[10px] font-semibold">
                            ⏸ Audio Paused
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-100/90 mt-0.5 truncate max-w-sm sm:max-w-md">
                        Step {audioDmIndex + 1} of {divineMercySequence.length}: {divineMercySequence[audioDmIndex]?.stepTitle}
                      </p>
                    </div>

                    {/* Action buttons: Restart, Previous, Pause/Resume, Next, Stop */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                      {/* 1. Restart Button */}
                      <button
                        type="button"
                        onClick={() => setShowDmRestartConfirm(true)}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Restart Chaplet audio from beginning"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </button>

                      {/* 2. Previous Button (with label) */}
                      <button
                        type="button"
                        onClick={handleAudioPrevDm}
                        disabled={audioDmIndex === 0}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Previous audio prayer"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      {/* 3. Pause / Resume Button */}
                      <button
                        type="button"
                        onClick={handlePauseResumeDm}
                        className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm tracking-wide shadow-md transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                      >
                        {!isDmPaused ? (
                          <>
                            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-950" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-950" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>

                      {/* 4. Next Button */}
                      <button
                        type="button"
                        onClick={handleAudioNextDm}
                        disabled={audioDmIndex >= divineMercySequence.length - 1}
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        title="Next audio prayer"
                      >
                        <span>Next</span>
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>

                      {/* 5. Stop Button */}
                      {isDmActive && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                          title="Stop audio"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Prompt when Restart is clicked */}
                  {showDmRestartConfirm && (
                    <div className="p-3 rounded-xl bg-black/40 border border-amber-400/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 animate-fadeIn">
                      <div className="flex items-center space-x-2 text-xs text-rose-100">
                        <RotateCcw className="w-4 h-4 text-amber-300 shrink-0" />
                        <span className="font-semibold">Do you want to start from the beginning?</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleRestartDmConfirmed}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition shadow-xs cursor-pointer"
                        >
                          Yes, Restart
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDmRestartConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice & Pacing Settings Accordion */}
              <div className="pt-2.5 mt-2.5 border-t border-white/15">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-black/25 hover:bg-black/35 text-amber-200 hover:text-white transition text-[11px] font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>🕊️ Relaxing Voice & Pace</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showVoiceSettings ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-200/90 font-medium">
                    <span className="hidden sm:inline">Cadence:</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/20 text-amber-300 font-mono">
                      {rosaryRate === '0.85' ? '0.85x (Gentle)' : rosaryRate === '0.78' ? '0.78x (Deep)' : `${rosaryRate}x`}
                    </span>
                  </div>
                </div>

                {showVoiceSettings && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/35 border border-white/10 space-y-3 animate-fadeIn text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
                        <span>Select Voice on your Device:</span>
                        <button
                          type="button"
                          onClick={handleTestVoice}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-[10px] transition flex items-center space-x-1"
                          title="Preview prayer in this voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>▶ Test Voice</span>
                        </button>
                      </div>
                      <select
                        value={selectedVoiceURI}
                        onChange={(e) => {
                          setSelectedVoiceURI(e.target.value);
                          speechService.setSelectedVoiceURI(e.target.value);
                        }}
                        className="w-full p-2 rounded-xl bg-neutral-900 border border-amber-500/40 text-neutral-100 text-xs focus:ring-2 focus:ring-amber-400 outline-hidden font-sans"
                      >
                        {availableVoices.length === 0 ? (
                          <option value="">Device Default Natural Voice</option>
                        ) : (
                          availableVoices.map((v) => (
                            <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                              {v.badge ? `${v.badge} • ${v.name}` : v.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-amber-200">
                        Prayer Cadence & Speed:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: '0.85', label: '🕊️ Gentle (0.85x)', sub: 'Calm & Reverent' },
                          { id: '0.78', label: '🕊️ Deep (0.78x)', sub: 'Meditative' },
                          { id: '1.0', label: 'Standard (1.0x)', sub: 'Brisk' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setRosaryRate(p.id);
                              try { localStorage.setItem('catholic_bible_rosary_rate', p.id); } catch {}
                              speechService.setRate(parseFloat(p.id));
                            }}
                            className={`p-2 rounded-xl border text-center transition ${
                              rosaryRate === p.id
                                ? 'bg-amber-400 text-amber-950 border-amber-400 font-bold shadow-sm'
                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                            }`}
                          >
                            <div className="text-[11px] font-bold">{p.label}</div>
                            <div className="text-[9px] opacity-80 mt-0.5">{p.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Switcher Pills for Divine Mercy */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {DM_SECTIONS.map((sec) => {
                const isActive = currentDmSection.id === sec.id;
                const isPassed = dmStepIndex > sec.endIndex;
                return (
                  <button
                    key={sec.id}
                    onClick={() => handleJumpToDmStep(sec.startIndex)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1 shrink-0 ${
                      isActive
                        ? 'bg-rose-700 text-white font-bold shadow-xs'
                        : isPassed
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
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
            <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-neutral-900/50 border border-rose-200/70 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-rose-900 dark:text-rose-200">
                  {currentDmSection.label} Beads
                </span>
                <span className="text-[11px] text-neutral-500">
                  Click any bead to jump or recite
                </span>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-2 pt-1 pb-1">
                {currentDmSectionSteps.map((step, localIdx) => {
                  const absoluteIdx = currentDmSection.startIndex + localIdx;
                  const isCurrent = absoluteIdx === dmStepIndex;
                  const isDone = absoluteIdx < dmStepIndex;

                  let beadStyle = 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300';
                  if (isCurrent) {
                    beadStyle = 'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-400/40 font-bold scale-110 shadow-md';
                  } else if (isDone) {
                    beadStyle = 'bg-rose-100 dark:bg-rose-950/50 border-rose-400 text-rose-800 dark:text-rose-300';
                  }

                  const isLargeBead = step.beadType === 'large';

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleJumpToDmStep(absoluteIdx)}
                      className={`relative flex items-center justify-center rounded-full transition-all duration-200 select-none ${
                        isLargeBead ? 'px-3 py-1.5 h-8 min-w-[32px] text-xs rounded-xl' : 'w-7 h-7 text-[11px]'
                      } border ${beadStyle}`}
                      title={step.stepTitle}
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

            {/* Divine Mercy Prayer Reading Hero Card */}
            <div 
              className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/90 border-2 border-rose-300/80 dark:border-rose-600/40 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-800 dark:text-rose-400">
                    {currentDmStep.subtitle || currentDmSection.label} • Step {dmStepIndex + 1} of {divineMercySequence.length}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-neutral-900 dark:text-neutral-100">
                    {currentDmStep.stepTitle}
                  </h3>
                </div>

                <button
                  onClick={() => handleSpeakPrayer(currentDmStep.speechText || currentDmStep.text)}
                  className="p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs bg-rose-50 hover:bg-rose-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-neutral-700 cursor-pointer"
                  title="Listen to this prayer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen</span>
                </button>
              </div>

              {/* Prayer text */}
              <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-neutral-800/40 border border-rose-100 dark:border-neutral-800">
                <p className="font-serif text-base sm:text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                  {currentDmStep.text}
                </p>
              </div>
            </div>

            {/* Bottom Stepper & Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Progress: {dmStepIndex + 1} of {divineMercySequence.length} prayers ({Math.round(((dmStepIndex + 1) / divineMercySequence.length) * 100)}%)</span>
                <span>{currentDmSection.label}</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((dmStepIndex + 1) / divineMercySequence.length) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDmStepIndex(0)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                  title="Start reading from beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start at Beginning</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevManualDm}
                    disabled={dmStepIndex === 0}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent text-neutral-700 dark:text-neutral-300 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextManualDm}
                    disabled={dmStepIndex >= divineMercySequence.length - 1}
                    className="px-4 sm:px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>
                      {dmStepIndex < divineMercySequence.length - 1
                        ? `Next: ${divineMercySequence[dmStepIndex + 1].stepTitle}`
                        : 'Chaplet Finished'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chaplet Guide & Notes Card */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-neutral-900/40 border border-amber-200/60 dark:border-neutral-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <span>🕊️</span>
                <span>The 3:00 PM Hour of Great Mercy</span>
              </h4>
              <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                Our Lord asked Saint Faustina that the Chaplet be prayed especially at 3:00 PM, the hour of His death on the Cross: 
                <span className="italic font-serif"> "At three o'clock, implore My mercy, especially for sinners; and, if only for a brief moment, immerse yourself in My Passion... This is the hour of great mercy for the whole world."</span>
              </p>
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
                      onClick={() => handleSpeakPrayer(prayer.text)}
                      className="p-1.5 rounded-lg text-xs bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 hover:bg-amber-50 transition flex items-center space-x-1"
                      title="Listen aloud (prayer only, no titles)"
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

