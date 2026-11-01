// Browser Web Speech API Audio Controller (100% Offline, Pure English Audio Engine)

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
    this.onItemChangeCallback = null;
    this.voices = [];

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  // Selects the highest quality natural English voice available on the device
  getBestEnglishVoice() {
    if (!this.synth) return null;
    const voices = (this.voices && this.voices.length > 0) ? this.voices : (this.synth.getVoices() || []);
    if (!voices || voices.length === 0) return null;

    // Filter exclusively English voices
    const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length === 0) return voices[0] || null;

    // Preferred natural, clear English voices across Mac, Windows, iOS, Chrome, Android
    const priorityNames = [
      'Google US English',
      'Google UK English Female',
      'Samantha',
      'Siri',
      'Daniel',
      'Karen',
      'Natural',
      'Jenny',
      'Guy',
      'Aria',
      'Serena',
      'Oliver',
      'Ava'
    ];

    for (const name of priorityNames) {
      const match = enVoices.find(v => v.name.includes(name) && !v.name.toLowerCase().includes('compact'));
      if (match) return match;
    }

    // Secondary: standard en-US or en-GB
    const standardEn = enVoices.find(v => v.lang === 'en-US' || v.lang === 'en_US' || v.lang === 'en-GB');
    if (standardEn) return standardEn;

    return enVoices[0];
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
    this.onItemChangeCallback = null;
    this.isPlaying = true;
    this.isPaused = false;
    this.triggerState();

    this.speakVerseAt(0);
  }

  // Alias for compatibility
  speakSingleVerse(verseObj) {
    this.playSingleVerse(verseObj);
  }

  playSequence(items, startIndex = 0, onItemChange = null) {
    if (!this.synth) return;
    this.stop();

    this.versesQueue = items;
    this.currentIndex = startIndex;
    this.onItemChangeCallback = onItemChange;
    this.isPlaying = true;
    this.isPaused = false;
    this.triggerState();

    this.speakVerseAt(this.currentIndex);
  }

  jumpTo(index) {
    if (!this.synth || !this.isPlaying) return;
    if (index >= 0 && index < this.versesQueue.length) {
      this.synth.cancel();
      this.speakVerseAt(index);
    }
  }

  next() {
    if (!this.synth || !this.isPlaying) return;
    if (this.currentIndex + 1 < this.versesQueue.length) {
      this.synth.cancel();
      this.speakVerseAt(this.currentIndex + 1);
    } else {
      this.stop();
    }
  }

  prev() {
    if (!this.synth || !this.isPlaying) return;
    if (this.currentIndex > 0) {
      this.synth.cancel();
      this.speakVerseAt(this.currentIndex - 1);
    }
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
    if (this.onItemChangeCallback) {
      this.onItemChangeCallback(item, index);
    }

    const rawText = item.verse 
      ? `Verse ${item.verse}. ${item.text}` 
      : item.text;

    // Clean text for natural pronunciation (remove bracketed footnotes, markdown asterisks, etc.)
    const cleanText = rawText
      .replace(/\[\d+\]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[*_#~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.lang = 'en-US'; // Exclusively English audio

    const englishVoice = this.getBestEnglishVoice();
    if (englishVoice) {
      utterance.voice = englishVoice;
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
    this.onItemChangeCallback = null;
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
