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
    
    return {\n      id: this.generateId(),\n      name: config.name || 'Unnamed Agent',\n      voiceProfile: {\n        style: this.normalizeStyle(config.voiceProfile?.style || 'encouraging'),\n        pace: this.normalizePace(config.voiceProfile?.pace || 'medium'),\n        energy: this.normalizeEnergy(config.voiceProfile?.energy || 'moderate'),\n        customVoiceUrl: config.voiceProfile?.voiceSample\n      },\n      wakeWords: config.wakeWords || ['hey claude', 'hey rashee'],\n      conversationPatterns,\n      personality: {\n        traits: config.traits || ['encouraging', 'supportive'],\n        responseStyle: config.voiceProfile?.style || 'encouraging'\n      },\n      integrations: {\n        whatsapp: config.integrations?.includes('whatsapp') || false,\n        web: config.integrations?.includes('web') || true,\n        appleWatch: config.integrations?.includes('apple watch') || false\n      }\n    };\n  }\n  \n  private static generateId(): string {\n    return 'agent_' + Math.random().toString(36).substr(2, 9);\n  }\n  \n  private static normalizeStyle(style: string): 'encouraging' | 'direct' | 'analytical' | 'socratic' {\n    const normalized = style.toLowerCase();\n    if (['direct', 'analytical', 'socratic'].includes(normalized)) {\n      return normalized as any;\n    }\n    return 'encouraging';\n  }\n  \n  private static normalizePace(pace: string): 'slow' | 'medium' | 'fast' {\n    const normalized = pace.toLowerCase();\n    if (['slow', 'fast'].includes(normalized)) {\n      return normalized as any;\n    }\n    return 'medium';\n  }\n  \n  private static normalizeEnergy(energy: string): 'low' | 'moderate' | 'high' {\n    const normalized = energy.toLowerCase();\n    if (['low', 'high'].includes(normalized)) {\n      return normalized as any;\n    }\n    return 'moderate';\n  }\n\n  // Generate markdown template for new agents\n  static generateTemplate(name: string = 'My Personal Coach'): string {\n    return `# ${name}\n\n## Voice Profile\n- **Style:** encouraging\n- **Pace:** medium  \n- **Energy:** moderate\n- **Voice Sample:** (upload your voice file here)\n\n## Wake Words\n- hey claude\n- hey rashee\n- start coaching\n\n## Conversation Patterns\n### Greeting\n- Good morning! I'm here to help you make the most of your day.\n- Hello! Ready to tackle your goals together?\n\n### Check-in Questions\n- How did you sleep last night?\n- What's your energy level right now?\n- What's most important to you today?\n\n### Response Patterns\n- tired → I understand you're feeling tired. Let's plan a gentle day that still moves you forward.\n- energetic → Great energy! Let's channel that into your most important goals.\n- stuck → When I feel stuck, I like to break things down into smaller steps. What's one tiny thing we could try?\n- motivated → I love that motivation! Let's capture it with a specific action plan.\n\n## Personality\n### Traits\n- Encouraging and supportive\n- Practical and action-oriented\n- Emotionally intelligent\n- Growth-minded\n\n## Integrations\n- WhatsApp: ✅\n- Web Interface: ✅\n- Apple Watch: ❌\n`;\n  }\n\n  // Validate markdown configuration\n  static validateConfig(markdown: string): { isValid: boolean; errors: string[]; warnings: string[] } {\n    const errors: string[] = [];\n    const warnings: string[] = [];\n    \n    try {\n      const config = this.parseMarkdown(markdown);\n      \n      // Required fields validation\n      if (!config.name || config.name === 'Unnamed Agent') {\n        errors.push('Agent name is required');\n      }\n      \n      if (!config.wakeWords || config.wakeWords.length === 0) {\n        errors.push('At least one wake word is required');\n      }\n      \n      if (!config.conversationPatterns || config.conversationPatterns.length === 0) {\n        warnings.push('No conversation patterns defined - agent will use defaults');\n      }\n      \n      // Voice profile validation\n      if (!['encouraging', 'direct', 'analytical', 'socratic'].includes(config.voiceProfile.style)) {\n        warnings.push('Invalid voice style - will default to \"encouraging\"');\n      }\n      \n      if (!['slow', 'medium', 'fast'].includes(config.voiceProfile.pace)) {\n        warnings.push('Invalid voice pace - will default to \"medium\"');\n      }\n      \n      if (!['low', 'moderate', 'high'].includes(config.voiceProfile.energy)) {\n        warnings.push('Invalid voice energy - will default to \"moderate\"');\n      }\n      \n      // Integration validation\n      if (!config.integrations.web && !config.integrations.whatsapp && !config.integrations.appleWatch) {\n        errors.push('At least one integration platform must be enabled');\n      }\n      \n    } catch (error) {\n      errors.push(`Failed to parse configuration: ${error}`);\n    }\n    \n    return {\n      isValid: errors.length === 0,\n      errors,\n      warnings\n    };\n  }\n}\n\nexport default VoiceAgentParser;