// Browser Web Speech API Audio Controller (100% Offline, Pure English Audio Engine)

class SpeechController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.rate = 0.88; // Default to gentle, prayerful pace
    this.pitch = 1.0;
    this.isPlaying = false;
    this.isPaused = false;
    this.onVerseChangeCallback = null;
    this.onStateChangeCallback = null;
    this.stateListeners = new Set();
    this.versesQueue = [];
    this.currentIndex = 0;
    this.onItemChangeCallback = null;
    this.onCompleteCallback = null;
    this.voices = [];
    this.selectedVoiceURI = null;
    this.interPrayerPauseMs = 650; // Reverent breathing pause between Rosary beads
    this.keepAliveTimer = null;

    if (typeof window !== 'undefined') {
      try {
        this.selectedVoiceURI = localStorage.getItem('catholic_bible_rosary_voice') || null;
      } catch {}
    }

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

  // Returns sorted list of English voices with natural/calm voices highlighted
  getEnglishVoices() {
    if (!this.synth) return [];
    const voices = (this.voices && this.voices.length > 0) ? this.voices : (this.synth.getVoices() || []);
    if (!voices || voices.length === 0) return [];

    const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));

    return enVoices.map(v => {
      const name = v.name;
      const isNatural = name.includes('Natural') || name.includes('Online') || name.includes('Enhanced') || name.includes('Premium');
      const isGoogle = name.includes('Google');
      const isSiri = name.includes('Siri');
      const isSerenaSamantha = name.includes('Samantha') || name.includes('Serena') || name.includes('Daniel') || name.includes('Jenny') || name.includes('Ava') || name.includes('Aria') || name.includes('Guy');
      const isRelaxing = isNatural || isGoogle || isSiri || isSerenaSamantha;

      let badge = '';
      if (isNatural || isSiri) badge = '✨ Natural Human';
      else if (isRelaxing) badge = '🕊️ Relaxing';

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        badge,
        isRelaxing
      };
    }).sort((a, b) => {
      if (a.isRelaxing && !b.isRelaxing) return -1;
      if (!a.isRelaxing && b.isRelaxing) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  setSelectedVoiceURI(uri) {
    this.selectedVoiceURI = uri || null;
    try {
      if (uri) {
        localStorage.setItem('catholic_bible_rosary_voice', uri);
      } else {
        localStorage.removeItem('catholic_bible_rosary_voice');
      }
    } catch {}
  }

  getSelectedVoiceURI() {
    if (!this.selectedVoiceURI && typeof window !== 'undefined') {
      try {
        this.selectedVoiceURI = localStorage.getItem('catholic_bible_rosary_voice') || null;
      } catch {}
    }
    return this.selectedVoiceURI;
  }

  // Selects the highest quality natural English voice available on the device
  getBestEnglishVoice() {
    if (!this.synth) return null;
    const voices = (this.voices && this.voices.length > 0) ? this.voices : (this.synth.getVoices() || []);
    if (!voices || voices.length === 0) return null;

    // Filter exclusively English voices
    const enVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length === 0) return voices[0] || null;

    // If user explicitly chose a voice, use it
    if (this.selectedVoiceURI) {
      const matched = enVoices.find(v => v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI);
      if (matched) return matched;
    }

    // Preferred natural, gentle human voices across Mac, Windows Edge, iOS, Chrome, Android
    const priorityNames = [
      'Microsoft Jenny Online (Natural)',
      'Microsoft Aria Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Google US English',
      'Google UK English Female',
      'Samantha',
      'Siri',
      'Ava',
      'Serena',
      'Daniel',
      'Karen',
      'Natural',
      'Jenny',
      'Guy',
      'Aria',
      'Oliver'
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

  playSequence(items, startIndex = 0, onItemChange = null, options = {}, onComplete = null) {
    if (!this.synth) return;
    this.stop();

    if (options.rate) {
      this.rate = options.rate;
    }
    if (options.voiceURI) {
      this.selectedVoiceURI = options.voiceURI;
    }

    this.versesQueue = items;
    this.currentIndex = startIndex;
    this.onItemChangeCallback = onItemChange;
    this.onCompleteCallback = onComplete;
    this.isPlaying = true;
    this.isPaused = false;
    this.startKeepAlive();
    this.triggerState();

    this.speakVerseAt(this.currentIndex);
  }

  startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (!this.synth || !this.isPlaying || this.isPaused) return;
      this.synth.pause();
      this.synth.resume();
    }, 10000);
  }

  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  // Play a 3-second sample to test how the voice sounds
  previewVoice(voiceURI, rate = 0.86) {
    if (!this.synth) return;
    this.stop();

    const sampleText = "Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women.";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const allVoices = (this.voices && this.voices.length > 0) ? this.voices : (this.synth.getVoices() || []);
    const match = allVoices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
    if (match) {
      utterance.voice = match;
    } else {
      utterance.voice = this.getBestEnglishVoice();
    }

    this.synth.speak(utterance);
  }

  jumpTo(index) {
    if (!this.synth) return;
    if (index >= 0 && index < this.versesQueue.length) {
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
      }
      this.synth.cancel();
      this.isPlaying = true;
      this.startKeepAlive();
      this.speakVerseAt(index);
    }
  }

  next() {
    if (!this.synth) return;
    if (this.currentIndex + 1 < this.versesQueue.length) {
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
      }
      this.synth.cancel();
      this.isPlaying = true;
      this.startKeepAlive();
      this.speakVerseAt(this.currentIndex + 1);
    } else {
      this.stop();
    }
  }

  prev() {
    if (!this.synth) return;
    if (this.currentIndex > 0) {
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
      }
      this.synth.cancel();
      this.isPlaying = true;
      this.startKeepAlive();
      this.speakVerseAt(this.currentIndex - 1);
    }
  }

  speakVerseAt(index) {
    if (!this.synth || index >= this.versesQueue.length) {
      if (this.onCompleteCallback) {
        try {
          this.onCompleteCallback();
        } catch (e) {
          console.warn('onComplete error:', e);
        }
      }
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
    this.triggerState();

    const rawText = item.verse 
      ? `Verse ${item.verse}. ${item.text}` 
      : item.text;

    // Clean text: keep periods, commas, and ellipses (...) which create natural breathing pauses!
    const cleanText = rawText
      .replace(/\[\d+\]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[*#~`]/g, '')
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
        // Natural meditative breathing pause between prayers (650ms)
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.speakVerseAt(this.currentIndex + 1);
          }
        }, this.interPrayerPauseMs);
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (this.isPlaying && !this.isPaused) {
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.speakVerseAt(this.currentIndex + 1);
          }
        }, this.interPrayerPauseMs);
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
    this.stopKeepAlive();
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.versesQueue = [];
    this.currentIndex = 0;
    this.onItemChangeCallback = null;
    this.onCompleteCallback = null;
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
