/**
 * Voice Agent Configuration Parser
 * Parses .md files to create zero-code voice agents
 */

import { VoiceConfig } from './VoiceService';

export interface VoiceAgentConfig extends VoiceConfig {
  id: string;
  name: string;
  description: string;
  triggers: {
    phrases: string[];
    contexts: string[];
  };
  personality: {
    traits: string[];
    responseStyle: string;
    examples: Record<string, string>;
  };
  integrations: {
    whatsapp?: boolean;
    web?: boolean;
    watch?: boolean;
  };
}

export class VoiceAgentParser {
  /**
   * Parse a markdown file to create voice agent configuration
   */
  public static parseMarkdown(markdownContent: string): VoiceAgentConfig {
    const lines = markdownContent.split('\n');
    const config: Partial<VoiceAgentConfig> = {
      wakeWords: [],
      conversationFlow: {
        greeting: '',
        checkInQuestions: [],
        responses: {}
      },
      triggers: {
        phrases: [],
        contexts: []
      },
      personality: {
        traits: [],
        responseStyle: '',
        examples: {}
      },
      integrations: {}
    };

    let currentSection = '';
    let currentSubsection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('<!--')) continue;

      // Main sections
      if (line.startsWith('# ')) {
        config.name = line.substring(2).trim();
        continue;
      }

      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim().toLowerCase();
        continue;
      }

      if (line.startsWith('### ')) {
        currentSubsection = line.substring(4).trim().toLowerCase();
        continue;
      }

      // Parse content based on section
      this.parseSection(config, currentSection, currentSubsection, line, lines, i);
    }

    return this.validateAndComplete(config);
  }

  private static parseSection(
    config: Partial<VoiceAgentConfig>,
    section: string,
    subsection: string,
    line: string,
    allLines: string[],
    index: number
  ) {
    switch (section) {
      case 'voice profile':
        this.parseVoiceProfile(config, line);
        break;

      case 'wake words':
      case 'trigger phrases':
        if (line.startsWith('- ')) {
          config.wakeWords = config.wakeWords || [];
          config.wakeWords.push(line.substring(2).trim().toLowerCase());
        }
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

      case 'examples':
        this.parseExamples(config, line);
        break;
    }
  }

  private static parseVoiceProfile(config: Partial<VoiceAgentConfig>, line: string) {
    if (line.includes('**Style:**')) {
      const style = this.extractValue(line) as 'encouraging' | 'direct' | 'analytical' | 'socratic';
      config.voiceProfile = { ...config.voiceProfile, style };
    }
    if (line.includes('**Pace:**')) {
      const pace = this.extractValue(line) as 'slow' | 'medium' | 'fast';
      config.voiceProfile = { ...config.voiceProfile, pace };
    }
    if (line.includes('**Energy:**')) {
      const energy = this.extractValue(line) as 'calm' | 'moderate' | 'energetic';
      config.voiceProfile = { ...config.voiceProfile, energy };
    }
    if (line.includes('**Voice Sample:**')) {
      const audioUrl = this.extractValue(line);
      config.voiceProfile = { ...config.voiceProfile, audioUrl };
    }
  }

  private static parseConversationPatterns(
    config: Partial<VoiceAgentConfig>,
    subsection: string,
    line: string
  ) {
    if (!config.conversationFlow) return;

    if (subsection === 'greeting' && line.startsWith('- ')) {
      config.conversationFlow.greeting = line.substring(2).trim();
    }

    if (subsection === 'check-in questions' && line.startsWith('- ')) {
      config.conversationFlow.checkInQuestions.push(line.substring(2).trim());
    }

    if (line.includes('→')) {
      const [trigger, response] = line.split('→').map(s => s.trim());
      config.conversationFlow.responses[trigger.toLowerCase()] = response;
    }
  }

  private static parsePersonality(
    config: Partial<VoiceAgentConfig>,
    subsection: string,
    line: string
  ) {
    if (!config.personality) return;

    if (subsection === 'traits' && line.startsWith('- ')) {
      config.personality.traits.push(line.substring(2).trim());
    }

    if (subsection === 'response style') {
      config.personality.responseStyle = line;
    }
  }

  private static parseIntegrations(config: Partial<VoiceAgentConfig>, line: string) {
    if (!config.integrations) return;

    if (line.includes('WhatsApp') && line.includes('✅')) {
      config.integrations.whatsapp = true;
    }
    if (line.includes('Web') && line.includes('✅')) {
      config.integrations.web = true;
    }
    if (line.includes('Apple Watch') && line.includes('✅')) {
      config.integrations.watch = true;
    }
  }

  private static parseExamples(config: Partial<VoiceAgentConfig>, line: string) {
    if (line.includes('→')) {
      const [input, output] = line.split('→').map(s => s.trim());
      if (config.personality) {
        config.personality.examples[input.toLowerCase()] = output;
      }
    }
  }

  private static extractValue(line: string): string {
    const match = line.match(/\*\*[^:]+:\*\*\s*(.+)/);
    return match ? match[1].trim() : '';
  }

  private static validateAndComplete(config: Partial<VoiceAgentConfig>): VoiceAgentConfig {
    // Set defaults for required fields
    const complete: VoiceAgentConfig = {
      id: config.name?.toLowerCase().replace(/\s+/g, '-') || 'unnamed-agent',
      name: config.name || 'Unnamed Agent',
      description: `AI voice agent: ${config.name}`,
      wakeWords: config.wakeWords || ['hey claude'],
      voiceProfile: {
        name: 'default',
        style: 'encouraging',
        pace: 'medium',
        energy: 'moderate',
        ...config.voiceProfile
      },
      conversationFlow: {
        greeting: 'Hello! How can I help you today?',
        checkInQuestions: ['How are you feeling?'],
        responses: {},
        ...config.conversationFlow
      },
      triggers: config.triggers || {
        phrases: [],
        contexts: []
      },
      personality: {
        traits: [],
        responseStyle: 'Warm and encouraging',
        examples: {},
        ...config.personality
      },
      integrations: config.integrations || {}
    };

    return complete;
  }
}

// Example template generator
export const generateVoiceAgentTemplate = (name: string = 'My Personal Coach'): string => {
  return `# ${name}

## Voice Profile
- **Style:** encouraging
- **Pace:** medium  
- **Energy:** moderate
- **Voice Sample:** (upload your voice file here)

## Wake Words
- hey ${name.toLowerCase()}
- ${name.toLowerCase()}
- start coaching

## Conversation Patterns

### Greeting
- Good morning! I'm here to help you make the most of your day. How are you feeling?

### Check-in Questions
- How did you sleep last night?
- What's your energy level right now?
- What's the most important thing you want to accomplish today?

### Response Patterns
- tired → I understand you're feeling tired. Let's plan a gentle but productive day.
- energetic → Great energy! Let's channel that into your most important goals.
- stressed → I hear that you're feeling stressed. Let's break things down into manageable steps.
- stuck → When I feel stuck, I like to step back and look at the bigger picture. What's really important here?

## Personality

### Traits
- Encouraging and supportive
- Practical and action-oriented  
- Emotionally intelligent
- Patient and understanding

### Response Style
Warm, conversational, and gently motivating. I speak like a wise friend who genuinely cares about your growth.

## Integrations
- WhatsApp: ✅
- Web Interface: ✅
- Apple Watch: ✅

## Examples
- "I'm having a tough morning" → "I hear you. Tough mornings happen to everyone. Let's start small - what's one tiny thing you can do right now to shift your energy?"
- "What should I focus on?" → "Let me look at your goals and schedule. Based on what I see, your top priority today should be [specific recommendation]."
- "I completed my workout" → "Yes! That's fantastic! I love seeing you follow through on your commitments. How do you feel right now?"

---
*Generated by Rashenal Voice Agent Builder*`;
};
