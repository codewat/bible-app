// Browser Web Speech API Audio Controller (100% Offline)

class SpeechController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.isPlaying = false;
    this.isPaused = false;
    this.onVerseChangeCallback = null;
    this.onStateChangeCallback = null;
    this.stateListeners = new Set();
    this.versesQueue = [];
    this.currentIndex = 0;
  }

  addStateListener(listener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  isSupported() {
    return Boolean(this.synth);
  }

  setCallbacks({ onVerseChange, onStateChange }) {
    this.onVerseChangeCallback = onVerseChange;
    this.onStateChangeCallback = onStateChange;
  }

  setRate(rate) {
    this.rate = rate;
    if (this.isPlaying && !this.isPaused) {
      // Re-speak current with new rate
      const cur = this.versesQueue[this.currentIndex];
      if (cur) {
        this.synth.cancel();
        this.speakVerseAt(this.currentIndex);
      }
    }
  }

  playChapter(verses, startIndex = 0) {
    if (!this.synth) return;
    this.stop();

    this.versesQueue = verses;
    this.currentIndex = startIndex;
    this.isPlaying = true;
    this.isPaused = false;
    this.triggerState();

    this.speakVerseAt(this.currentIndex);
  }

  playSingleVerse(verseObj) {
    if (!this.synth) return;
    this.stop();

    this.versesQueue = [verseObj];
    this.currentIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.triggerState();

    this.speakVerseAt(0);
  }

  speakVerseAt(index) {
    if (!this.synth || index >= this.versesQueue.length) {
      this.stop();
      return;
    }

    this.currentIndex = index;
    const item = this.versesQueue[index];
    if (this.onVerseChangeCallback) {
      this.onVerseChangeCallback(item);
    }

    const textToSpeak = item.verse 
      ? `Verse ${item.verse}. ${item.text}` 
      : item.text;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.lang = item.lang || 'en-US';

    // Pick a voice if available
    const voices = this.synth.getVoices();
    if (item.lang && !item.lang.startsWith('en')) {
      const matchVoice = voices.find(v => v.lang.toLowerCase().startsWith(item.lang.slice(0, 2).toLowerCase()));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    } else {
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Samantha')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        this.speakVerseAt(this.currentIndex + 1);
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (this.isPlaying && !this.isPaused) {
        this.speakVerseAt(this.currentIndex + 1);
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (!this.synth || !this.isPlaying) return;
    this.synth.pause();
    this.isPaused = true;
    this.triggerState();
  }

  resume() {
    if (!this.synth || !this.isPlaying) return;
    this.synth.resume();
    this.isPaused = false;
    this.triggerState();
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.versesQueue = [];
    this.currentIndex = 0;
    if (this.onVerseChangeCallback) {
      this.onVerseChangeCallback(null);
    }
    this.triggerState();
  }

  triggerState() {
    const state = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      rate: this.rate
    };
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('Speech listener error:', err);
      }
    });
  }
}

export const speechService = new SpeechController();

