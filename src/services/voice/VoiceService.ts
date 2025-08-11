/**
 * Rashenal Voice Service
 * Zero-code voice agent foundation with custom voice support
 */

export interface VoiceConfig {
  wakeWords: string[];
  voiceProfile?: {
    name: string;
    audioUrl?: string;
    style: 'encouraging' | 'direct' | 'analytical' | 'socratic';
    pace: 'slow' | 'medium' | 'fast';
    energy: 'calm' | 'moderate' | 'energetic';
  };
  conversationFlow: {
    greeting: string;
    checkInQuestions: string[];
    responses: Record<string, string>;
  };
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private config: VoiceConfig;
  private onTranscript?: (text: string) => void;
  private onVoiceResponse?: (text: string) => void;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.synthesis = window.speechSynthesis;
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[event.results.length - 1].isFinal) {
        this.handleTranscript(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  private handleTranscript(transcript: string) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Check for wake words
    const isWakeWordDetected = this.config.wakeWords.some(wake => 
      lowerTranscript.includes(wake.toLowerCase())
    );

    if (isWakeWordDetected || this.isListening) {
      this.onTranscript?.(transcript);
    }
  }

  public startListening(onTranscript: (text: string) => void) {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    this.onTranscript = onTranscript;
    this.isListening = true;
    this.recognition.start();
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public async speak(text: string, options?: {
    voice?: string;
    rate?: number;
    pitch?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice profile settings
      if (this.config.voiceProfile) {
        switch (this.config.voiceProfile.pace) {
          case 'slow': utterance.rate = 0.8; break;
          case 'fast': utterance.rate = 1.2; break;
          default: utterance.rate = 1.0;
        }

        switch (this.config.voiceProfile.energy) {
          case 'calm': utterance.pitch = 0.8; break;
          case 'energetic': utterance.pitch = 1.2; break;
          default: utterance.pitch = 1.0;
        }
      }

      // Override with custom options
      if (options) {
        if (options.rate) utterance.rate = options.rate;
        if (options.pitch) utterance.pitch = options.pitch;
      }

      // Select voice if specified
      if (options?.voice || this.config.voiceProfile?.name) {
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name === (options?.voice || this.config.voiceProfile?.name)
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  public updateConfig(newConfig: Partial<VoiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Future: Custom voice synthesis integration point
  public async speakWithCustomVoice(text: string, voiceUrl: string): Promise<void> {
    // Placeholder for custom voice synthesis (ElevenLabs, etc.)
    console.log('Custom voice synthesis coming soon:', { text, voiceUrl });
    return this.speak(text);
  }
}

// Default configuration for quick setup
export const createDefaultVoiceConfig = (overrides?: Partial<VoiceConfig>): VoiceConfig => ({
  wakeWords: ['hey claude', 'hey rashee', 'rashenal'],
  voiceProfile: {
    name: 'default',
    style: 'encouraging',
    pace: 'medium',
    energy: 'moderate'
  },
  conversationFlow: {
    greeting: "Good morning! I'm here to help you make the most of your day. How are you feeling?",
    checkInQuestions: [
      "How did you sleep?",
      "What's your energy level like today?",
      "What's the most important thing you want to accomplish?"
    ],
    responses: {
      tired: "I understand you're feeling tired. Let's plan a gentle but productive day.",
      energetic: "Great energy! Let's channel that into your most important goals.",
      stressed: "I hear that you're feeling stressed. Let's break things down into manageable steps."
    }
  },
  ...overrides
});
