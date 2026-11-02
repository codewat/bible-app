import React from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';

export default function PrayerAudioPlayerBar({
  isRosaryActive,
  isRosaryPaused,
  rosaryStepTitle,
  audioRosaryIndex,
  totalRosarySteps,
  isDmActive,
  isDmPaused,
  dmStepTitle,
  audioDmIndex,
  totalDmSteps,
  onPrev,
  onNext,
  onPauseResume,
  onStop,
  onOpenPrayers,
  hasBiblePlayerVisible = false
}) {
  if (!isRosaryActive && !isDmActive) return null;

  const isRosary = isRosaryActive;
  const isPaused = isRosary ? isRosaryPaused : isDmPaused;
  const stepNum = isRosary ? audioRosaryIndex + 1 : audioDmIndex + 1;
  const totalSteps = isRosary ? totalRosarySteps : totalDmSteps;
  const title = isRosary ? 'Holy Rosary Audio' : 'Divine Mercy Audio';
  const stepText = isRosary ? rosaryStepTitle : dmStepTitle;
  const icon = isRosary ? '📿' : '✝️';

  const themeGradient = isRosary
    ? 'from-amber-900 via-amber-800 to-amber-950 border-amber-600/50 shadow-amber-950/40'
    : 'from-rose-950 via-red-900 to-amber-950 border-rose-600/50 shadow-rose-950/40';

  return (
    <div className={`w-full max-w-xl bg-gradient-to-r ${themeGradient} text-white backdrop-blur-md rounded-2xl shadow-2xl border p-2.5 sm:px-4 sm:py-3 flex items-center justify-between transition-all duration-300 animate-slideDown pointer-events-auto`}>
      {/* Prayer Details (clickable to open full prayer modal) */}
      <div 
        onClick={onOpenPrayers}
        className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2 cursor-pointer group"
        title="Click to open Prayer Book"
      >
        <span className="text-xl sm:text-2xl select-none shrink-0 group-hover:scale-110 transition-transform">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-serif font-bold text-xs sm:text-sm text-amber-200 group-hover:text-amber-100 truncate">
              {title}
            </span>
            {!isPaused ? (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[9px] font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Reciting</span>
              </span>
            ) : (
              <span className="text-[9px] bg-amber-500/30 px-1.5 py-0.2 rounded text-amber-200 shrink-0 font-medium">
                ⏸ Paused
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-200/90 truncate font-sans">
            Step {stepNum} of {totalSteps}: {stepText}
          </p>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        <button
          type="button"
          onClick={onPrev}
          disabled={stepNum <= 1}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
          title="Previous prayer"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onPauseResume}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow transition active:scale-95 flex items-center space-x-1 cursor-pointer"
          title={isPaused ? 'Resume recitation' : 'Pause'}
        >
          {!isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-amber-950" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-amber-950" />
              <span className="hidden sm:inline">Resume</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={stepNum >= totalSteps}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
          title="Next prayer"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Option to close the prayer player */}
        <button
          type="button"
          onClick={onStop}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer ml-1"
          title="Stop & Close prayer audio player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

