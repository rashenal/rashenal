import { VoiceAgentConfig, ConversationPattern } from './VoiceService';

export interface MarkdownVoiceConfig {
  name: string;
  voiceProfile: {
    style: string;
    pace: string;
    energy: string;
    voiceSample?: string;
  };
  wakeWords: string[];
  greetings: string[];
  checkinQuestions: string[];
  responsePatterns: { [key: string]: string };
  traits: string[];
  integrations: string[];
}

export class VoiceAgentParser {
  static parseMarkdown(markdown: string): VoiceAgentConfig {
    const lines = markdown.split('\n');
    const config: Partial<MarkdownVoiceConfig> = {};
    
    let currentSection = '';
    let currentSubsection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('<!--')) continue;
      
      // Main headers
      if (trimmed.startsWith('# ')) {
        config.name = trimmed.replace('# ', '');
        continue;
      }
      
      // Section headers
      if (trimmed.startsWith('## ')) {
        currentSection = trimmed.replace('## ', '').toLowerCase();
        currentSubsection = '';
        continue;
      }
      
      // Subsection headers
      if (trimmed.startsWith('### ')) {
        currentSubsection = trimmed.replace('### ', '').toLowerCase();
        continue;
      }
      
      // Parse content based on current section
      this.parseSection(config, currentSection, currentSubsection, trimmed);
    }
    
    return this.convertToVoiceAgentConfig(config);
  }
  
  private static parseSection(
    config: Partial<MarkdownVoiceConfig>, 
    section: string, 
    subsection: string, 
    line: string
  ) {
    switch (section) {
      case 'voice profile':
        this.parseVoiceProfile(config, line);
        break;
        
      case 'wake words':
        this.parseWakeWords(config, line);
        break;
        
      case 'conversation patterns':
        this.parseConversationPatterns(config, subsection, line);
        break;
        
      case 'personality':
        this.parsePersonality(config, subsection, line);
        break;
        
      case 'integrations':
        this.parseIntegrations(config, line);
        break;
    }
  }
  
  private static parseVoiceProfile(config: Partial<MarkdownVoiceConfig>, line: string) {
    if (!config.voiceProfile) config.voiceProfile = { style: '', pace: '', energy: '' };
    
    if (line.includes('**Style:**')) {
      config.voiceProfile.style = line.split('**Style:**')[1]?.trim() || '';
    } else if (line.includes('**Pace:**')) {
      config.voiceProfile.pace = line.split('**Pace:**')[1]?.trim() || '';
    } else if (line.includes('**Energy:**')) {
      config.voiceProfile.energy = line.split('**Energy:**')[1]?.trim() || '';
    } else if (line.includes('**Voice Sample:**')) {
      config.voiceProfile.voiceSample = line.split('**Voice Sample:**')[1]?.trim() || '';
    }
  }
  
  private static parseWakeWords(config: Partial<MarkdownVoiceConfig>, line: string) {
    if (!config.wakeWords) config.wakeWords = [];
    
    if (line.startsWith('- ')) {
      const wakeWord = line.replace('- ', '').trim();
      config.wakeWords.push(wakeWord);
    }
  }
  
  private static parseConversationPatterns(
    config: Partial<MarkdownVoiceConfig>, 
    subsection: string, 
    line: string
  ) {
    switch (subsection) {
      case 'greeting':
        if (!config.greetings) config.greetings = [];
        if (line.startsWith('- ')) {
          config.greetings.push(line.replace('- ', '').trim());
        }
        break;
        
      case 'check-in questions':
        if (!config.checkinQuestions) config.checkinQuestions = [];
        if (line.startsWith('- ')) {
          config.checkinQuestions.push(line.replace('- ', '').trim());
        }
        break;
        
      case 'response patterns':
        if (!config.responsePatterns) config.responsePatterns = {};
        if (line.includes(' → ')) {
          const [trigger, response] = line.split(' → ');
          if (trigger && response) {
            config.responsePatterns[trigger.replace('- ', '').trim()] = response.trim();
          }
        }
        break;
    }
  }
  
  private static parsePersonality(
    config: Partial<MarkdownVoiceConfig>, 
    subsection: string, 
    line: string
  ) {
    if (subsection === 'traits' && line.startsWith('- ')) {
      if (!config.traits) config.traits = [];
      config.traits.push(line.replace('- ', '').trim());
    }
  }
  
  private static parseIntegrations(config: Partial<MarkdownVoiceConfig>, line: string) {
    if (!config.integrations) config.integrations = [];
    
    if (line.includes(': ✅')) {
      const integration = line.split(':')[0]?.replace('- ', '').trim();
      if (integration) {
        config.integrations.push(integration.toLowerCase());
      }
    }
  }
  
  private static convertToVoiceAgentConfig(config: Partial<MarkdownVoiceConfig>): VoiceAgentConfig {
    // Convert parsed markdown to VoiceAgentConfig
    const conversationPatterns: ConversationPattern[] = [];
    
    // Add greeting patterns
    if (config.greetings) {
      config.greetings.forEach(greeting => {
        conversationPatterns.push({
          trigger: 'hello',
          response: greeting,
          context: 'general'
        });
      });
    }
    
    // Add response patterns
    if (config.responsePatterns) {
      Object.entries(config.responsePatterns).forEach(([trigger, response]) => {
        conversationPatterns.push({
          trigger,
          response,
          context: 'general'
        });
      });
    }
    
    // Add check-in patterns
    if (config.checkinQuestions) {
      conversationPatterns.push({
        trigger: 'how am i doing',
        response: config.checkinQuestions[0] || 'How are you feeling today?',
        context: 'general'
      });
    }
    
    return {
      id: this.generateId(),
      name: config.name || 'Unnamed Agent',
      voiceProfile: {
        style: this.normalizeStyle(config.voiceProfile?.style || 'encouraging'),
        pace: this.normalizePace(config.voiceProfile?.pace || 'medium'),
        energy: this.normalizeEnergy(config.voiceProfile?.energy || 'moderate'),
        customVoiceUrl: config.voiceProfile?.voiceSample
      },
      wakeWords: config.wakeWords || ['hey claude', 'hey rashee'],
      conversationPatterns,
      personality: {
        traits: config.traits || ['encouraging', 'supportive'],
        responseStyle: config.voiceProfile?.style || 'encouraging'
      },
      integrations: {
        whatsapp: config.integrations?.includes('whatsapp') || false,
        web: config.integrations?.includes('web') || true,
        appleWatch: config.integrations?.includes('apple watch') || false
      }
    };
  }
  
  private static generateId(): string {
    return 'agent_' + Math.random().toString(36).substr(2, 9);
  }
  
  private static normalizeStyle(style: string): 'encouraging' | 'direct' | 'analytical' | 'socratic' {
    const normalized = style.toLowerCase();
    if (['direct', 'analytical', 'socratic'].includes(normalized)) {
      return normalized as any;
    }
    return 'encouraging';
  }
  
  private static normalizePace(pace: string): 'slow' | 'medium' | 'fast' {
    const normalized = pace.toLowerCase();
    if (['slow', 'fast'].includes(normalized)) {
      return normalized as any;
    }
    return 'medium';
  }
  
  private static normalizeEnergy(energy: string): 'low' | 'moderate' | 'high' {
    const normalized = energy.toLowerCase();
    if (['low', 'high'].includes(normalized)) {
      return normalized as any;
    }
    return 'moderate';
  }

  // Generate markdown template for new agents
  static generateTemplate(name: string = 'My Personal Coach'): string {
    return `# ${name}

## Voice Profile
- **Style:** encouraging
- **Pace:** medium  
- **Energy:** moderate
- **Voice Sample:** (upload your voice file here)

## Wake Words
- hey claude
- hey rashee
- start coaching

## Conversation Patterns
### Greeting
- Good morning! I'm here to help you make the most of your day.
- Hello! Ready to tackle your goals together?

### Check-in Questions
- How did you sleep last night?
- What's your energy level right now?
- What's most important to you today?

### Response Patterns
- tired → I understand you're feeling tired. Let's plan a gentle day that still moves you forward.
- energetic → Great energy! Let's channel that into your most important goals.
- stuck → When I feel stuck, I like to break things down into smaller steps. What's one tiny thing we could try?
- motivated → I love that motivation! Let's capture it with a specific action plan.

## Personality
### Traits
- Encouraging and supportive
- Practical and action-oriented
- Emotionally intelligent
- Growth-minded

## Integrations
- WhatsApp: ✅
- Web Interface: ✅
- Apple Watch: ❌
`;
  }

  // Validate markdown configuration
  static validateConfig(markdown: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const config = this.parseMarkdown(markdown);
      
      // Required fields validation
      if (!config.name || config.name === 'Unnamed Agent') {
        errors.push('Agent name is required');
      }
      
      if (!config.wakeWords || config.wakeWords.length === 0) {
        errors.push('At least one wake word is required');
      }
      
      if (!config.conversationPatterns || config.conversationPatterns.length === 0) {
        warnings.push('No conversation patterns defined - agent will use defaults');
      }
      
      // Voice profile validation
      if (!['encouraging', 'direct', 'analytical', 'socratic'].includes(config.voiceProfile.style)) {
        warnings.push('Invalid voice style - will default to "encouraging"');
      }
      
      if (!['slow', 'medium', 'fast'].includes(config.voiceProfile.pace)) {
        warnings.push('Invalid voice pace - will default to "medium"');
      }
      
      if (!['low', 'moderate', 'high'].includes(config.voiceProfile.energy)) {
        warnings.push('Invalid voice energy - will default to "moderate"');
      }
      
      // Integration validation
      if (!config.integrations.web && !config.integrations.whatsapp && !config.integrations.appleWatch) {
        errors.push('At least one integration platform must be enabled');
      }
      
    } catch (error) {
      errors.push(`Failed to parse configuration: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default VoiceAgentParser;
