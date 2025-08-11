// VoiceBiometric - Voice authentication and biometric security service
// Handles voice print creation, verification, and secure voice commands

export interface VoiceProfile {
  userId: string;
  voicePrint: Float32Array;
  confidence: number;
  createdAt: Date;
  lastUpdated: Date;
  sampleRate: number;
  features: VoiceFeatures;
}

export interface VoiceFeatures {
  fundamentalFreq: number;
  formants: number[];
  spectralCentroid: number;
  mfcc: number[];
  voicePrintHash: string;
}

export interface AuthenticationResult {
  isAuthenticated: boolean;
  confidence: number;
  userId?: string;
  error?: string;
  timestamp: Date;
}

export class VoiceBiometric {
  private userId: string | null = null;
  private voiceProfile: VoiceProfile | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private confidenceThreshold = 0.8; // 80% confidence required

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadVoiceProfile();
    this.isInitialized = true;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isInitialized || !this.voiceProfile) {
      return false;
    }
    
    // Check if voice profile exists and is valid
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - this.voiceProfile.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    // Voice profiles expire after 30 days for security
    return daysSinceUpdate < 30;
  }

  async createVoiceProfile(audioData: Float32Array, sampleRate: number): Promise<VoiceProfile> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const features = await this.extractVoiceFeatures(audioData, sampleRate);
      const voicePrint = await this.generateVoicePrint(audioData, features);
      
      const profile: VoiceProfile = {
        userId: this.userId,
        voicePrint,
        confidence: 0.95, // High confidence for initial creation
        createdAt: new Date(),
        lastUpdated: new Date(),
        sampleRate,
        features
      };

      await this.saveVoiceProfile(profile);
      this.voiceProfile = profile;
      
      return profile;
    } catch (error) {
      console.error('Failed to create voice profile:', error);
      throw error;
    }
  }

  async authenticateVoice(audioData: Float32Array, sampleRate: number): Promise<AuthenticationResult> {
    if (!this.voiceProfile) {
      return {
        isAuthenticated: false,
        confidence: 0,
        error: 'No voice profile found',
        timestamp: new Date()
      };
    }

    try {
      const features = await this.extractVoiceFeatures(audioData, sampleRate);
      const similarity = await this.compareVoiceFeatures(features, this.voiceProfile.features);
      
      const isAuthenticated = similarity >= this.confidenceThreshold;
      
      if (isAuthenticated) {
        // Update last authentication time
        this.voiceProfile.lastUpdated = new Date();
        await this.saveVoiceProfile(this.voiceProfile);
      }

      return {
        isAuthenticated,
        confidence: similarity,
        userId: isAuthenticated ? this.userId! : undefined,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Voice authentication failed:', error);
      return {
        isAuthenticated: false,
        confidence: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async updateVoiceProfile(audioData: Float32Array, sampleRate: number): Promise<boolean> {
    if (!this.voiceProfile) return false;

    try {
      const newFeatures = await this.extractVoiceFeatures(audioData, sampleRate);
      const similarity = await this.compareVoiceFeatures(newFeatures, this.voiceProfile.features);
      
      if (similarity < 0.7) {
        // Voice has changed too much, require re-authentication
        return false;
      }

      // Blend new features with existing ones (weighted average)
      const blendedFeatures = this.blendVoiceFeatures(this.voiceProfile.features, newFeatures, 0.8);
      
      this.voiceProfile.features = blendedFeatures;
      this.voiceProfile.lastUpdated = new Date();
      
      await this.saveVoiceProfile(this.voiceProfile);
      return true;
    } catch (error) {
      console.error('Failed to update voice profile:', error);
      return false;
    }
  }

  async deleteVoiceProfile(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      // In a real implementation, this would delete from secure storage
      localStorage.removeItem(`voice_profile_${this.userId}`);
      this.voiceProfile = null;
      return true;
    } catch (error) {
      console.error('Failed to delete voice profile:', error);
      return false;
    }
  }

  // Security features
  async detectSpoofing(audioData: Float32Array): Promise<boolean> {
    // Implement anti-spoofing detection
    // This would analyze audio characteristics to detect:
    // - Synthetic speech
    // - Playback attacks
    // - Voice conversion attacks
    
    try {
      const features = await this.extractAntispoofingFeatures(audioData);
      return this.classifyAsGenuine(features);
    } catch (error) {
      console.error('Spoofing detection failed:', error);
      return false; // Err on the side of caution
    }
  }

  async isLiveVoice(audioData: Float32Array): Promise<boolean> {
    // Detect if the voice is from a live person vs recording
    try {
      const livenessFeatures = await this.extractLivenessFeatures(audioData);
      return this.classifyAsLive(livenessFeatures);
    } catch (error) {
      console.error('Liveness detection failed:', error);
      return false;
    }
  }

  // Private methods
  private async loadVoiceProfile(): Promise<void> {
    if (!this.userId) return;

    try {
      // In production, this would load from secure server storage
      const profileData = localStorage.getItem(`voice_profile_${this.userId}`);
      if (profileData) {
        const parsed = JSON.parse(profileData);
        this.voiceProfile = {
          ...parsed,
          voicePrint: new Float32Array(parsed.voicePrint),
          createdAt: new Date(parsed.createdAt),
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Failed to load voice profile:', error);
    }
  }

  private async saveVoiceProfile(profile: VoiceProfile): Promise<void> {
    try {
      // Convert Float32Array to regular array for JSON serialization
      const serializable = {
        ...profile,
        voicePrint: Array.from(profile.voicePrint)
      };
      
      // In production, this would save to secure server storage with encryption
      localStorage.setItem(`voice_profile_${this.userId}`, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save voice profile:', error);
      throw error;
    }
  }

  private async extractVoiceFeatures(audioData: Float32Array, sampleRate: number): Promise<VoiceFeatures> {
    // Extract voice biometric features using audio analysis
    
    // Fundamental frequency (pitch)
    const fundamentalFreq = this.extractFundamentalFrequency(audioData, sampleRate);
    
    // Formants (resonant frequencies)
    const formants = this.extractFormants(audioData, sampleRate);
    
    // Spectral centroid (brightness)
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    
    // MFCC (Mel-frequency cepstral coefficients)
    const mfcc = this.calculateMFCC(audioData, sampleRate);
    
    // Create voice print hash
    const voicePrintHash = await this.createVoicePrintHash(audioData);

    return {
      fundamentalFreq,
      formants,
      spectralCentroid,
      mfcc,
      voicePrintHash
    };
  }

  private async generateVoicePrint(audioData: Float32Array, features: VoiceFeatures): Promise<Float32Array> {
    // Generate a unique voice print from audio data and features
    const voicePrint = new Float32Array(128); // 128-dimensional voice print
    
    // Combine various features into the voice print
    // This is a simplified implementation - in production, this would use
    // sophisticated audio processing and machine learning techniques
    
    for (let i = 0; i < 128; i++) {
      voicePrint[i] = Math.random(); // Placeholder - would be actual feature extraction
    }
    
    return voicePrint;
  }

  private async compareVoiceFeatures(features1: VoiceFeatures, features2: VoiceFeatures): Promise<number> {
    // Calculate similarity between two voice feature sets
    let similarity = 0;
    let totalWeight = 0;
    
    // Fundamental frequency comparison (weight: 0.2)
    const freqSimilarity = 1 - Math.abs(features1.fundamentalFreq - features2.fundamentalFreq) / 
                          Math.max(features1.fundamentalFreq, features2.fundamentalFreq);
    similarity += freqSimilarity * 0.2;
    totalWeight += 0.2;
    
    // Formants comparison (weight: 0.3)
    const formantSimilarity = this.calculateArraySimilarity(features1.formants, features2.formants);
    similarity += formantSimilarity * 0.3;
    totalWeight += 0.3;
    
    // MFCC comparison (weight: 0.4)
    const mfccSimilarity = this.calculateArraySimilarity(features1.mfcc, features2.mfcc);
    similarity += mfccSimilarity * 0.4;
    totalWeight += 0.4;
    
    // Spectral centroid comparison (weight: 0.1)
    const spectralSimilarity = 1 - Math.abs(features1.spectralCentroid - features2.spectralCentroid) / 
                              Math.max(features1.spectralCentroid, features2.spectralCentroid);
    similarity += spectralSimilarity * 0.1;
    totalWeight += 0.1;
    
    return similarity / totalWeight;
  }

  private calculateArraySimilarity(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) return 0;
    
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      sum += 1 - Math.abs(arr1[i] - arr2[i]) / Math.max(Math.abs(arr1[i]), Math.abs(arr2[i]), 1);
    }
    
    return sum / arr1.length;
  }

  private blendVoiceFeatures(existing: VoiceFeatures, newFeatures: VoiceFeatures, existingWeight: number): VoiceFeatures {
    const newWeight = 1 - existingWeight;
    
    return {
      fundamentalFreq: existing.fundamentalFreq * existingWeight + newFeatures.fundamentalFreq * newWeight,
      formants: existing.formants.map((val, i) => val * existingWeight + (newFeatures.formants[i] || 0) * newWeight),
      spectralCentroid: existing.spectralCentroid * existingWeight + newFeatures.spectralCentroid * newWeight,
      mfcc: existing.mfcc.map((val, i) => val * existingWeight + (newFeatures.mfcc[i] || 0) * newWeight),
      voicePrintHash: newFeatures.voicePrintHash // Hash is updated with new features
    };
  }

  // Audio processing methods (simplified implementations)
  private extractFundamentalFrequency(audioData: Float32Array, sampleRate: number): number {
    // Simplified pitch detection using autocorrelation
    // In production, this would use more sophisticated algorithms like YIN or SWIPE
    
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
    
    let bestPeriod = minPeriod;
    let maxCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < audioData.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return sampleRate / bestPeriod;
  }

  private extractFormants(audioData: Float32Array, sampleRate: number): number[] {
    // Simplified formant extraction using peak picking in frequency domain
    // In production, this would use linear predictive coding (LPC) analysis
    
    const fft = this.performFFT(audioData);
    const spectrum = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
    
    const formants: number[] = [];
    const minFormantSpacing = sampleRate / audioData.length * 10; // Minimum spacing between formants
    
    // Find peaks in the spectrum
    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
        const frequency = (i * sampleRate) / (2 * spectrum.length);
        
        // Check if this peak is far enough from existing formants
        let validFormant = true;
        for (const existingFormant of formants) {
          if (Math.abs(frequency - existingFormant) < minFormantSpacing) {
            validFormant = false;
            break;
          }
        }
        
        if (validFormant && frequency > 200 && frequency < 4000) {
          formants.push(frequency);
          if (formants.length >= 4) break; // We typically track 4 formants
        }
      }
    }
    
    return formants.sort((a, b) => a - b);
  }

  private calculateSpectralCentroid(audioData: Float32Array): number {
    const fft = this.performFFT(audioData);
    const spectrum = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
    
    let weightedSum = 0;
    let totalMagnitude = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      weightedSum += i * spectrum[i];
      totalMagnitude += spectrum[i];
    }
    
    return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  }

  private calculateMFCC(audioData: Float32Array, sampleRate: number): number[] {
    // Simplified MFCC calculation
    // In production, this would use proper mel-scale filter banks
    
    const numCoefficients = 13;
    const mfcc: number[] = new Array(numCoefficients).fill(0);
    
    const fft = this.performFFT(audioData);
    const spectrum = fft.map(complex => Math.sqrt(complex.real * complex.real + complex.imag * complex.imag));
    
    // Apply mel filter banks (simplified)
    const melFilters = this.createMelFilterBanks(numCoefficients, spectrum.length, sampleRate);
    
    for (let i = 0; i < numCoefficients; i++) {
      for (let j = 0; j < spectrum.length; j++) {
        mfcc[i] += spectrum[j] * melFilters[i][j];
      }
      mfcc[i] = Math.log(Math.max(mfcc[i], 1e-10)); // Log transform
    }
    
    // Apply DCT (Discrete Cosine Transform)
    return this.applyDCT(mfcc);
  }

  private async createVoicePrintHash(audioData: Float32Array): Promise<string> {
    // Create a hash of the voice print for quick comparison
    const hashInput = Array.from(audioData).join(',');
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Anti-spoofing and liveness detection methods
  private async extractAntispoofingFeatures(audioData: Float32Array): Promise<number[]> {
    // Extract features that help detect synthetic speech
    // This would analyze things like:
    // - Spectral inconsistencies
    // - Unnatural formant transitions  
    // - Missing micro-variations in pitch
    // - Compression artifacts
    
    return new Array(16).fill(0).map(() => Math.random()); // Placeholder
  }

  private classifyAsGenuine(features: number[]): boolean {
    // Use machine learning model to classify if voice is genuine
    // This would be trained on datasets of genuine vs synthetic speech
    
    // Placeholder implementation
    const score = features.reduce((sum, val) => sum + val, 0) / features.length;
    return score > 0.5; // Simplified threshold
  }

  private async extractLivenessFeatures(audioData: Float32Array): Promise<number[]> {
    // Extract features that indicate live vs recorded speech
    // This would analyze:
    // - Background noise characteristics
    // - Micro-variations in timing and pitch
    // - Room acoustics and reverberation
    // - Breathing patterns
    
    return new Array(12).fill(0).map(() => Math.random()); // Placeholder
  }

  private classifyAsLive(features: number[]): boolean {
    // Use ML model to classify if voice is from live person
    const score = features.reduce((sum, val) => sum + val, 0) / features.length;
    return score > 0.6; // Higher threshold for liveness
  }

  // Utility methods for audio processing
  private performFFT(audioData: Float32Array): { real: number; imag: number }[] {
    // Simplified FFT implementation
    // In production, use a proper FFT library like fft.js
    const N = audioData.length;
    const result: { real: number; imag: number }[] = [];
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += audioData[n] * Math.cos(angle);
        imag += audioData[n] * Math.sin(angle);
      }
      
      result.push({ real, imag });
    }
    
    return result;
  }

  private createMelFilterBanks(numFilters: number, spectrumLength: number, sampleRate: number): number[][] {
    // Create mel-scale filter banks
    const melFilters: number[][] = [];
    
    for (let i = 0; i < numFilters; i++) {
      const filter = new Array(spectrumLength).fill(0);
      
      // Simplified triangular filter
      const startFreq = (i * sampleRate) / (2 * numFilters);
      const centerFreq = ((i + 1) * sampleRate) / (2 * numFilters);
      const endFreq = ((i + 2) * sampleRate) / (2 * numFilters);
      
      for (let j = 0; j < spectrumLength; j++) {
        const freq = (j * sampleRate) / (2 * spectrumLength);
        
        if (freq >= startFreq && freq <= centerFreq) {
          filter[j] = (freq - startFreq) / (centerFreq - startFreq);
        } else if (freq > centerFreq && freq <= endFreq) {
          filter[j] = (endFreq - freq) / (endFreq - centerFreq);
        }
      }
      
      melFilters.push(filter);
    }
    
    return melFilters;
  }

  private applyDCT(data: number[]): number[] {
    // Apply Discrete Cosine Transform
    const result: number[] = [];
    const N = data.length;
    
    for (let k = 0; k < N; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += data[n] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * N));
      }
      result.push(sum);
    }
    
    return result;
  }
}