import { HabitAgent } from '../../agents/HabitAgent';
import { TaskAgent } from '../../agents/TaskAgent';

export interface VoiceAgentConfig {
  id: string;
  name: string;
  voiceProfile: {
    style: 'encouraging' | 'direct' | 'analytical' | 'socratic';
    pace: 'slow' | 'medium' | 'fast';
    energy: 'low' | 'moderate' | 'high';
    customVoiceUrl?: string;
  };
  wakeWords: string[];
  conversationPatterns: ConversationPattern[];
  personality: {
    traits: string[];
    responseStyle: string;
  };
  integrations: {
    whatsapp: boolean;
    web: boolean;
    appleWatch: boolean;
  };
}

export interface ConversationPattern {
  trigger: string;
  response: string;
  context?: 'habit' | 'task' | 'goal' | 'general';
  followUp?: string[];
}

export interface VoiceResponse {
  text: string;
  audio?: Blob;
  actions?: VoiceAction[];
  context?: any;
}

export interface VoiceAction {
  type: 'habit_log' | 'task_create' | 'goal_update' | 'reminder_set';
  data: any;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private config: VoiceAgentConfig;
  private habitAgent: HabitAgent;
  private taskAgent: TaskAgent;
  private userId: string;

  constructor(config: VoiceAgentConfig, userId: string) {
    this.config = config;
    this.userId = userId;
    this.synthesis = window.speechSynthesis;
    this.habitAgent = new HabitAgent(userId);
    this.taskAgent = new TaskAgent(userId);
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = this.handleSpeechEnd.bind(this);
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      return;
    }

    try {
      this.isListening = true;
      this.recognition.start();
      console.log('🎤 Voice agent listening...');
    } catch (error) {
      this.isListening = false;
      throw new Error(`Failed to start listening: ${error}`);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🔇 Voice agent stopped listening');
    }
  }

  private async handleSpeechResult(event: SpeechRecognitionEvent) {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join(' ')
      .toLowerCase()
      .trim();

    console.log('🗣️ Transcript:', transcript);

    // Check for wake words
    const wakeWordDetected = this.config.wakeWords.some(word => 
      transcript.includes(word.toLowerCase())
    );

    if (wakeWordDetected || this.isInConversation()) {
      const response = await this.processVoiceCommand(transcript);
      await this.speak(response.text);
      
      // Execute any actions
      if (response.actions) {
        await this.executeActions(response.actions);
      }
    }
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent) {
    console.error('🚨 Speech recognition error:', event.error);
    this.isListening = false;
  }

  private handleSpeechEnd() {
    this.isListening = false;
    // Auto-restart listening after a brief pause
    setTimeout(() => {
      if (this.config.integrations.web) {
        this.startListening();
      }
    }, 1000);
  }

  private isInConversation(): boolean {
    // Simple conversation state - in a real implementation,
    // this would track conversation context
    return true;
  }

  async processVoiceCommand(transcript: string): Promise<VoiceResponse> {
    try {
      // Check for pattern matches first
      const patternResponse = this.matchConversationPattern(transcript);
      if (patternResponse) {
        return patternResponse;
      }

      // Generate AI response using habit/task context
      const context = await this.gatherContext();
      const aiResponse = await this.generateAIResponse(transcript, context);
      
      return {
        text: aiResponse.text,
        actions: aiResponse.actions,
        context: context
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        text: "I'm sorry, I didn't catch that. Could you try again?",
        actions: []
      };
    }
  }

  private matchConversationPattern(transcript: string): VoiceResponse | null {
    for (const pattern of this.config.conversationPatterns) {
      if (transcript.includes(pattern.trigger.toLowerCase())) {
        return {
          text: pattern.response,
          actions: []
        };
      }
    }
    return null;
  }

  private async gatherContext(): Promise<any> {
    const [habits, tasks, optimizations] = await Promise.all([
      this.getRecentHabits(),
      this.getActiveTasks(),
      this.habitAgent.analyzeHabits()
    ]);

    return {
      habits,
      tasks,
      optimizations,
      timestamp: new Date().toISOString(),
      userStyle: this.config.voiceProfile.style
    };
  }

  private async getRecentHabits() {
    // Get habits due today or recently completed
    const suggestions = await this.habitAgent.monitorAndSuggest();
    return suggestions;
  }

  private async getActiveTasks() {
    // Get active tasks from TaskAgent - placeholder implementation
    return [];
  }

  private async generateAIResponse(transcript: string, context: any): Promise<VoiceResponse> {
    // This would call the Claude API via Supabase Edge Function
    // For now, return contextual response based on patterns
    
    if (transcript.includes('habit') || transcript.includes('routine')) {
      const habitSuggestions = await this.habitAgent.monitorAndSuggest();
      if (habitSuggestions.length > 0) {
        return {
          text: `${habitSuggestions[0]} Would you like me to log this habit for you?`,
          actions: []
        };
      }
    }

    if (transcript.includes('task') || transcript.includes('todo')) {
      return {
        text: "I can help you create a new task or review your current ones. What would you like to do?",
        actions: []
      };
    }

    if (transcript.includes('day') || transcript.includes('schedule')) {
      const dayBriefing = await this.generateDayBriefing(context);
      return {
        text: dayBriefing,
        actions: []
      };
    }

    // Default response based on personality
    return this.generatePersonalityResponse(transcript);
  }

  private async generateDayBriefing(context: any): Promise<string> {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Good morning!';
    } else if (hour < 17) {
      greeting = 'Good afternoon!';
    } else {
      greeting = 'Good evening!';
    }

    const briefing = [
      greeting,
      `You have ${context.tasks.length} active tasks today.`,
      context.habits.length > 0 ? `Habit reminder: ${context.habits[0]}` : '',
      'How can I help you make the most of your day?'
    ].filter(Boolean).join(' ');

    return briefing;
  }

  private generatePersonalityResponse(transcript: string): VoiceResponse {
    const style = this.config.voiceProfile.style;
    
    const responses = {
      encouraging: "I'm here to support you! What would you like to work on today?",
      direct: "How can I help you be more productive?",
      analytical: "Based on your patterns, what specific area would you like to focus on?",
      socratic: "What do you think would be the most impactful thing to focus on right now?"
    };

    return {
      text: responses[style],
      actions: []
    };
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice based on agent profile
      const voices = this.synthesis.getVoices();
      const preferredVoice = this.selectVoice(voices);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = this.getVoiceRate();
      utterance.pitch = this.getVoicePitch();
      utterance.volume = 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      console.log('🗣️ Speaking:', text);
      this.synthesis.speak(utterance);
    });
  }

  private selectVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // Priority: custom voice > female English > any English > default
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    const femaleVoices = englishVoices.filter(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('zira')
    );

    return femaleVoices[0] || englishVoices[0] || voices[0] || null;
  }

  private getVoiceRate(): number {
    const rates = { slow: 0.7, medium: 1.0, fast: 1.3 };
    return rates[this.config.voiceProfile.pace] || 1.0;
  }

  private getVoicePitch(): number {
    const pitches = { low: 0.8, moderate: 1.0, high: 1.2 };
    return pitches[this.config.voiceProfile.energy] || 1.0;
  }

  private async executeActions(actions: VoiceAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'habit_log':
            await this.logHabit(action.data);
            break;
          case 'task_create':
            await this.createTask(action.data);
            break;
          case 'goal_update':
            await this.updateGoal(action.data);
            break;
          case 'reminder_set':
            await this.setReminder(action.data);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async logHabit(data: any): Promise<void> {
    // Implementation would interact with Supabase
    console.log('🎯 Logging habit:', data);
  }

  private async createTask(data: any): Promise<void> {
    // Implementation would interact with Supabase
    console.log('✅ Creating task:', data);
  }

  private async updateGoal(data: any): Promise<void> {
    // Implementation would interact with Supabase
    console.log('🏆 Updating goal:', data);
  }

  private async setReminder(data: any): Promise<void> {
    // Implementation would interact with Supabase
    console.log('⏰ Setting reminder:', data);
  }

  // Public methods for external control
  async updateConfig(newConfig: Partial<VoiceAgentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Voice agent config updated');
  }

  getStatus(): { isListening: boolean; isSupported: boolean } {
    return {
      isListening: this.isListening,
      isSupported: !!this.recognition
    };
  }

  async testVoice(text: string = "Hello! I'm your personal voice agent."): Promise<void> {
    await this.speak(text);
  }
}

export default VoiceService;