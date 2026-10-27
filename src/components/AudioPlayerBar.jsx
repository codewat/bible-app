import React from 'react';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, X } from 'lucide-react';
import { speechService } from '../utils/speech';

export default function AudioPlayerBar({
  audioState,
  currentVerseSpeaking,
  bookName,
  chapter,
  onStopAudio,
}) {
  if (!audioState.isPlaying && !audioState.isPaused) {
    return null;
  }

  const rates = [0.8, 1.0, 1.2, 1.5];

  const handleTogglePlay = () => {
    if (audioState.isPaused) {
      speechService.resume();
    } else {
      speechService.pause();
    }
  };

  const handleNextSpeed = () => {
    const nextIdx = (rates.indexOf(audioState.rate) + 1) % rates.length;
    speechService.setRate(rates[nextIdx]);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-neutral-900/95 dark:bg-neutral-800/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-700/60 p-3 sm:px-5 sm:py-3.5 flex items-center justify-between animate-slideUp">
      {/* Current verse info */}
      <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
        <div className="p-2 rounded-xl bg-amber-600/30 text-amber-400 shrink-0">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-xs sm:text-sm text-amber-300 truncate">
              {bookName} {chapter}
              {currentVerseSpeaking ? `:${currentVerseSpeaking.verse}` : ''}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
              Audio Bible
            </span>
          </div>
          <p className="text-xs text-neutral-400 truncate font-serif italic">
            {currentVerseSpeaking ? currentVerseSpeaking.text : 'Catholic Scripture'}
          </p>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleNextSpeed}
          className="text-xs px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono transition"
          title="Playback Speed"
        >
          {audioState.rate}x
        </button>

        <button
          onClick={handleTogglePlay}
          className="p-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow transition transform active:scale-95"
          title={audioState.isPaused ? 'Resume' : 'Pause'}
        >
          {audioState.isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
        </button>

        <button
          onClick={onStopAudio}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          title="Stop reading"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={onStopAudio}
          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

