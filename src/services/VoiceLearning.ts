// AI Voice Learning System - Learns and maintains user's unique writing style
import { supabase } from '../lib/supabase';

export interface VoiceProfile {
  userId: string;
  averageLength: number;
  toneProfile: {
    professional: number;
    casual: number;
    inspirational: number;
    educational: number;
  };
  languagePatterns: {
    emojiUsage: number;
    questionUsage: number;
    exclamationUsage: number;
    hashtagUsage: number;
    linkUsage: number;
  };
  vocabularyProfile: {
    commonWords: string[];
    uniquePhrases: string[];
    technicalTerms: string[];
    personalBranding: string[];
  };
  engagementPatterns: {
    bestPerformingLength: number;
    bestPerformingTone: string;
    bestPerformingTime: string;
    bestPerformingHashtagCount: number;
  };
  contentPreferences: {
    preferredTopics: string[];
    callToActionStyle: string;
    storytellingStyle: 'first-person' | 'third-person' | 'mixed';
    structurePreference: 'linear' | 'bullet-points' | 'mixed';
  };
  platformAdaptation: {
    [platform: string]: {
      adaptedTone: string;
      adaptedLength: number;
      platformSpecificPatterns: any;
    };
  };
  lastUpdated: Date;
  confidence: number; // 0-100, based on amount of data
}

export interface ContentAnalysis {
  length: number;
  tone: string;
  sentiment: number; // -1 to 1
  readabilityScore: number;
  engagementFactors: {
    hasEmoji: boolean;
    hasQuestion: boolean;
    hasCallToAction: boolean;
    hashtagCount: number;
    mentionCount: number;
  };
  topicTags: string[];
  personalityMarkers: string[];
}

class VoiceLearningService {
  private userId: string | null = null;
  private voiceProfile: VoiceProfile | null = null;
  private readonly MIN_POSTS_FOR_LEARNING = 10;
  private readonly UPDATE_THRESHOLD = 5; // Update profile after every 5 new posts

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadVoiceProfile();
    if (!this.voiceProfile || this.shouldUpdateProfile()) {
      await this.generateVoiceProfile();
    }
  }

  private async loadVoiceProfile(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading voice profile:', error);
        return;
      }

      if (data) {
        this.voiceProfile = {
          userId: data.user_id,
          averageLength: data.average_length,
          toneProfile: data.tone_profile,
          languagePatterns: data.language_patterns,
          vocabularyProfile: data.vocabulary_profile,
          engagementPatterns: data.engagement_patterns,
          contentPreferences: data.content_preferences,
          platformAdaptation: data.platform_adaptation,
          lastUpdated: new Date(data.last_updated),
          confidence: data.confidence
        };
      }
    } catch (error) {
      console.error('Error loading voice profile:', error);
    }
  }

  private async shouldUpdateProfile(): Promise<boolean> {
    if (!this.voiceProfile) return true;

    try {
      // Check how many posts have been created since last profile update
      const { count } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('generated_by_ai', false)
        .gt('created_at', this.voiceProfile.lastUpdated.toISOString());

      return (count || 0) >= this.UPDATE_THRESHOLD;
    } catch (error) {
      console.error('Error checking update threshold:', error);
      return false;
    }
  }

  private async generateVoiceProfile(): Promise<void> {
    if (!this.userId) return;

    try {
      // Fetch user's authentic posts (not AI-generated)
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(`
          content,
          platform,
          engagement_metrics,
          created_at,
          scheduled_date
        `)
        .eq('user_id', this.userId)
        .eq('generated_by_ai', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching posts for voice analysis:', error);
        return;
      }

      if (!posts || posts.length < this.MIN_POSTS_FOR_LEARNING) {
        console.log(`Insufficient posts for voice learning (${posts?.length || 0}/${this.MIN_POSTS_FOR_LEARNING})`);
        return;
      }

      // Analyze all posts
      const analyses = posts.map(post => this.analyzeContent(post.content, post));
      
      // Generate voice profile from analyses
      const profile = this.buildVoiceProfile(analyses, posts);
      
      // Save or update profile
      await this.saveVoiceProfile(profile);
      
      this.voiceProfile = profile;
      console.log(`Voice profile generated with ${posts.length} posts (confidence: ${profile.confidence}%)`);

    } catch (error) {
      console.error('Error generating voice profile:', error);
    }
  }

  private analyzeContent(content: string, postData: any): ContentAnalysis {
    const length = content.length;
    
    // Tone detection using keyword analysis
    const tone = this.detectTone(content);
    
    // Sentiment analysis (basic)
    const sentiment = this.calculateSentiment(content);
    
    // Readability score (Flesch-like approximation)
    const readabilityScore = this.calculateReadability(content);
    
    // Engagement factors
    const engagementFactors = {
      hasEmoji: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u.test(content),
      hasQuestion: content.includes('?'),
      hasCallToAction: this.detectCallToAction(content),
      hashtagCount: (content.match(/#\w+/g) || []).length,
      mentionCount: (content.match(/@\w+/g) || []).length
    };
    
    // Topic extraction
    const topicTags = this.extractTopics(content);
    
    // Personality markers
    const personalityMarkers = this.extractPersonalityMarkers(content);

    return {
      length,
      tone,
      sentiment,
      readabilityScore,
      engagementFactors,
      topicTags,
      personalityMarkers
    };
  }

  private detectTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    const toneIndicators = {
      professional: [
        'insights', 'analysis', 'strategy', 'implementation', 'framework',
        'optimize', 'efficiency', 'methodology', 'best practices', 'industry',
        'leadership', 'management', 'expertise', 'professional', 'business'
      ],
      casual: [
        'hey', 'awesome', 'cool', 'fun', 'love', 'hate', 'totally', 'really',
        'kinda', 'gonna', 'wanna', 'yeah', 'nah', 'lol', 'btw', 'fyi'
      ],
      inspirational: [
        'dream', 'inspire', 'believe', 'achieve', 'success', 'motivation',
        'journey', 'transform', 'overcome', 'strength', 'courage', 'hope',
        'passion', 'purpose', 'vision', 'growth', 'breakthrough', 'empower'
      ],
      educational: [
        'learn', 'understand', 'explain', 'how to', 'why', 'because',
        'research', 'study', 'discover', 'knowledge', 'tip', 'guide',
        'tutorial', 'step', 'process', 'method', 'technique', 'skill'
      ]
    };

    const scores = {};
    Object.entries(toneIndicators).forEach(([tone, words]) => {
      scores[tone] = words.reduce((score, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerContent.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });

    const dominantTone = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return dominantTone || 'casual';
  }

  private calculateSentiment(content: string): number {
    const positiveWords = [
      'love', 'great', 'amazing', 'awesome', 'fantastic', 'excellent', 'good',
      'happy', 'excited', 'thrilled', 'grateful', 'blessed', 'wonderful',
      'perfect', 'brilliant', 'success', 'win', 'achievement', 'progress'
    ];
    
    const negativeWords = [
      'hate', 'terrible', 'awful', 'bad', 'horrible', 'disappointing', 'sad',
      'angry', 'frustrated', 'difficult', 'hard', 'struggle', 'problem',
      'fail', 'failure', 'mistake', 'wrong', 'error', 'issue'
    ];

    const words = content.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;

    return (positiveCount - negativeCount) / totalSentimentWords;
  }

  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).length - 1;
    const words = content.split(/\s+/).length;
    const syllables = content.split(/\s+/).reduce((count, word) => {
      return count + this.countSyllables(word);
    }, 0);

    if (sentences === 0 || words === 0) return 50; // Default neutral score

    // Modified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length <= 3) return 1;
    
    const vowels = cleanWord.match(/[aeiouy]+/g);
    let syllableCount = vowels ? vowels.length : 1;
    
    // Adjust for silent e
    if (cleanWord.endsWith('e')) syllableCount--;
    
    // Adjust for double vowels
    const doubleVowels = cleanWord.match(/[aeiouy]{2}/g);
    if (doubleVowels) syllableCount -= doubleVowels.length;
    
    return Math.max(1, syllableCount);
  }

  private detectCallToAction(content: string): boolean {
    const ctaPatterns = [
      /\b(share|comment|like|follow|subscribe|join|try|check out|visit|click|download)\b/i,
      /\b(what do you think|your thoughts|let me know|tell me)\b/i,
      /\?$/m, // Questions at end of lines
      /\b(tag a friend|tag someone)\b/i
    ];

    return ctaPatterns.some(pattern => pattern.test(content));
  }

  private extractTopics(content: string): string[] {
    const topicKeywords = {
      productivity: ['productivity', 'efficient', 'time management', 'focus', 'priorities'],
      wellness: ['health', 'wellness', 'meditation', 'mindfulness', 'exercise', 'mental health'],
      career: ['career', 'job', 'work', 'professional', 'leadership', 'skills', 'networking'],
      personal_growth: ['growth', 'development', 'learning', 'improvement', 'transformation'],
      entrepreneurship: ['startup', 'business', 'entrepreneur', 'innovation', 'strategy'],
      technology: ['tech', 'AI', 'software', 'digital', 'automation', 'data'],
      lifestyle: ['lifestyle', 'travel', 'family', 'hobbies', 'relationships', 'balance'],
      finance: ['money', 'investment', 'financial', 'budget', 'savings', 'wealth']
    };

    const lowerContent = content.toLowerCase();
    const detectedTopics = [];

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const hasKeyword = keywords.some(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      );
      if (hasKeyword) detectedTopics.push(topic);
    });

    return detectedTopics;
  }

  private extractPersonalityMarkers(content: string): string[] {
    const personalityIndicators = {
      storyteller: [/once upon a time/i, /let me tell you/i, /story/i, /when i was/i],
      analytical: [/data shows/i, /research indicates/i, /analysis/i, /statistics/i],
      motivational: [/you can do it/i, /believe in yourself/i, /never give up/i, /keep going/i],
      humorous: [/lol/i, /haha/i, /funny/i, /joke/i, /😂/u, /🤣/u],
      vulnerable: [/struggled with/i, /difficult time/i, /honest/i, /vulnerable/i, /confession/i],
      authoritative: [/in my experience/i, /i recommend/i, /best practice/i, /expert/i],
      community_focused: [/we/i, /us/i, /together/i, /community/i, /everyone/i],
      introspective: [/i wonder/i, /reflecting/i, /thinking about/i, /pondering/i]
    };

    const markers = [];
    Object.entries(personalityIndicators).forEach(([trait, patterns]) => {
      const hasPattern = patterns.some(pattern => pattern.test(content));
      if (hasPattern) markers.push(trait);
    });

    return markers;
  }

  private buildVoiceProfile(analyses: ContentAnalysis[], posts: any[]): VoiceProfile {
    const totalPosts = analyses.length;
    
    // Calculate averages and patterns
    const averageLength = analyses.reduce((sum, a) => sum + a.length, 0) / totalPosts;
    
    // Tone distribution
    const toneCount = analyses.reduce((counts, a) => {
      counts[a.tone] = (counts[a.tone] || 0) + 1;
      return counts;
    }, {});
    
    const toneProfile = {
      professional: (toneCount.professional || 0) / totalPosts,
      casual: (toneCount.casual || 0) / totalPosts,
      inspirational: (toneCount.inspirational || 0) / totalPosts,
      educational: (toneCount.educational || 0) / totalPosts
    };

    // Language patterns
    const languagePatterns = {
      emojiUsage: analyses.filter(a => a.engagementFactors.hasEmoji).length / totalPosts,
      questionUsage: analyses.filter(a => a.engagementFactors.hasQuestion).length / totalPosts,
      exclamationUsage: analyses.filter(a => a.tone === 'inspirational').length / totalPosts,
      hashtagUsage: analyses.reduce((sum, a) => sum + a.engagementFactors.hashtagCount, 0) / totalPosts,
      linkUsage: 0 // TODO: Implement link detection
    };

    // Extract vocabulary
    const allContent = posts.map(p => p.content).join(' ');
    const vocabularyProfile = this.buildVocabularyProfile(allContent);

    // Engagement patterns (requires engagement data)
    const postsWithEngagement = posts.filter(p => p.engagement_metrics);
    const engagementPatterns = this.calculateEngagementPatterns(postsWithEngagement, analyses);

    // Content preferences
    const contentPreferences = this.extractContentPreferences(analyses, posts);

    // Platform adaptation
    const platformAdaptation = this.analyzePlatformAdaptation(posts, analyses);

    // Confidence based on data quantity and consistency
    const confidence = Math.min(100, (totalPosts / 50) * 100); // 100% confidence with 50+ posts

    return {
      userId: this.userId!,
      averageLength,
      toneProfile,
      languagePatterns,
      vocabularyProfile,
      engagementPatterns,
      contentPreferences,
      platformAdaptation,
      lastUpdated: new Date(),
      confidence
    };
  }

  private buildVocabularyProfile(content: string): any {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});

    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => (b as number) - (a as number));

    const commonWords = sortedWords
      .slice(0, 20)
      .map(([word]) => word)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));

    // Extract unique phrases (2-3 word combinations that appear multiple times)
    const phrases = this.extractPhrases(content);
    
    return {
      commonWords: commonWords.slice(0, 15),
      uniquePhrases: phrases.slice(0, 10),
      technicalTerms: this.extractTechnicalTerms(words),
      personalBranding: this.extractPersonalBranding(content)
    };
  }

  private extractPhrases(content: string): string[] {
    const sentences = content.split(/[.!?]+/);
    const phrases = {};

    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      // Extract 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const twoWord = `${words[i]} ${words[i + 1]}`;
        phrases[twoWord] = (phrases[twoWord] || 0) + 1;
        
        if (i < words.length - 2) {
          const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          phrases[threeWord] = (phrases[threeWord] || 0) + 1;
        }
      }
    });

    return Object.entries(phrases)
      .filter(([phrase, count]) => (count as number) > 1)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([phrase]) => phrase);
  }

  private extractTechnicalTerms(words: string[]): string[] {
    const technicalPatterns = [
      /^(ai|api|ui|ux|seo|cto|ceo|saas|b2b|b2c|kpi|roi)$/,
      /^(machine|learning|algorithm|framework|platform|analytics|optimization)$/,
      /^(productivity|efficiency|automation|integration|scalability)$/
    ];

    const technicalTerms = words.filter(word =>
      technicalPatterns.some(pattern => pattern.test(word))
    );

    return [...new Set(technicalTerms)].slice(0, 10);
  }

  private extractPersonalBranding(content: string): string[] {
    const brandingPhrases = [];
    
    // Common personal branding phrases
    const patterns = [
      /I help \w+/gi,
      /I'm passionate about \w+/gi,
      /As a \w+/gi,
      /My mission is/gi,
      /I believe that/gi,
      /In my experience/gi
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        brandingPhrases.push(...matches.map(match => match.toLowerCase()));
      }
    });

    return [...new Set(brandingPhrases)].slice(0, 5);
  }

  private calculateEngagementPatterns(postsWithEngagement: any[], analyses: ContentAnalysis[]): any {
    if (postsWithEngagement.length === 0) {
      return {
        bestPerformingLength: 250,
        bestPerformingTone: 'inspirational',
        bestPerformingTime: '09:00',
        bestPerformingHashtagCount: 5
      };
    }

    // Calculate engagement rates
    const postsWithRates = postsWithEngagement.map((post, index) => {
      const analysis = analyses[index];
      const metrics = post.engagement_metrics;
      const engagementRate = (metrics.likes + metrics.comments + metrics.shares) / Math.max(metrics.views, 1);
      
      return {
        ...post,
        analysis,
        engagementRate,
        scheduledTime: new Date(post.scheduled_date).getHours()
      };
    });

    // Find best performing patterns
    const sortedByEngagement = postsWithRates.sort((a, b) => b.engagementRate - a.engagementRate);
    const top20Percent = sortedByEngagement.slice(0, Math.max(1, Math.floor(sortedByEngagement.length * 0.2)));

    const bestPerformingLength = top20Percent.reduce((sum, post) => sum + post.analysis.length, 0) / top20Percent.length;
    
    const toneCounts = top20Percent.reduce((counts, post) => {
      counts[post.analysis.tone] = (counts[post.analysis.tone] || 0) + 1;
      return counts;
    }, {});
    const bestPerformingTone = Object.entries(toneCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];

    const avgTime = top20Percent.reduce((sum, post) => sum + post.scheduledTime, 0) / top20Percent.length;
    const bestPerformingTime = `${Math.round(avgTime).toString().padStart(2, '0')}:00`;

    const bestPerformingHashtagCount = top20Percent.reduce((sum, post) => sum + post.analysis.engagementFactors.hashtagCount, 0) / top20Percent.length;

    return {
      bestPerformingLength: Math.round(bestPerformingLength),
      bestPerformingTone,
      bestPerformingTime,
      bestPerformingHashtagCount: Math.round(bestPerformingHashtagCount)
    };
  }

  private extractContentPreferences(analyses: ContentAnalysis[], posts: any[]): any {
    // Analyze preferred topics
    const allTopics = analyses.flatMap(a => a.topicTags);
    const topicCount = allTopics.reduce((counts, topic) => {
      counts[topic] = (counts[topic] || 0) + 1;
      return counts;
    }, {});
    
    const preferredTopics = Object.entries(topicCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([topic]) => topic);

    // Analyze storytelling style
    const firstPersonCount = posts.filter(p => /\bi\b|\bme\b|\bmy\b/.test(p.content.toLowerCase())).length;
    const thirdPersonCount = posts.filter(p => /\bhe\b|\bshe\b|\bthey\b|\bthem\b/.test(p.content.toLowerCase())).length;
    
    let storytellingStyle = 'mixed';
    if (firstPersonCount > thirdPersonCount * 2) storytellingStyle = 'first-person';
    else if (thirdPersonCount > firstPersonCount * 2) storytellingStyle = 'third-person';

    // Analyze structure preference
    const bulletPointPosts = posts.filter(p => p.content.includes('•') || p.content.includes('-') || p.content.includes('1.')).length;
    const structurePreference = bulletPointPosts > posts.length * 0.3 ? 'bullet-points' : 'linear';

    // Call to action style
    const ctaAnalyses = analyses.filter(a => a.engagementFactors.hasCallToAction);
    const callToActionStyle = ctaAnalyses.length > analyses.length * 0.5 ? 'direct' : 'subtle';

    return {
      preferredTopics,
      callToActionStyle,
      storytellingStyle,
      structurePreference
    };
  }

  private analyzePlatformAdaptation(posts: any[], analyses: ContentAnalysis[]): any {
    const platformData = {};
    
    // Group posts by platform
    posts.forEach((post, index) => {
      const platform = post.platform;
      const analysis = analyses[index];
      
      if (!platformData[platform]) {
        platformData[platform] = {
          posts: [],
          analyses: []
        };
      }
      
      platformData[platform].posts.push(post);
      platformData[platform].analyses.push(analysis);
    });

    const platformAdaptation = {};
    
    Object.entries(platformData).forEach(([platform, data]: [string, any]) => {
      const platformAnalyses = data.analyses;
      const avgLength = platformAnalyses.reduce((sum, a) => sum + a.length, 0) / platformAnalyses.length;
      
      const toneCount = platformAnalyses.reduce((counts, a) => {
        counts[a.tone] = (counts[a.tone] || 0) + 1;
        return counts;
      }, {});
      
      const adaptedTone = Object.entries(toneCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];

      platformAdaptation[platform] = {
        adaptedTone,
        adaptedLength: Math.round(avgLength),
        platformSpecificPatterns: {
          avgHashtags: platformAnalyses.reduce((sum, a) => sum + a.engagementFactors.hashtagCount, 0) / platformAnalyses.length,
          emojiUsage: platformAnalyses.filter(a => a.engagementFactors.hasEmoji).length / platformAnalyses.length,
          questionUsage: platformAnalyses.filter(a => a.engagementFactors.hasQuestion).length / platformAnalyses.length
        }
      };
    });

    return platformAdaptation;
  }

  private async saveVoiceProfile(profile: VoiceProfile): Promise<void> {
    if (!this.userId) return;

    try {
      const profileData = {
        user_id: this.userId,
        average_length: profile.averageLength,
        tone_profile: profile.toneProfile,
        language_patterns: profile.languagePatterns,
        vocabulary_profile: profile.vocabularyProfile,
        engagement_patterns: profile.engagementPatterns,
        content_preferences: profile.contentPreferences,
        platform_adaptation: profile.platformAdaptation,
        confidence: profile.confidence,
        last_updated: profile.lastUpdated.toISOString()
      };

      const { error } = await supabase
        .from('voice_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving voice profile:', error);
      }
    } catch (error) {
      console.error('Error saving voice profile:', error);
    }
  }

  // Public methods for content adaptation
  adaptContentToVoice(content: string, targetPlatform?: string): string {
    if (!this.voiceProfile) return content;

    let adaptedContent = content;

    // Apply platform-specific adaptations
    if (targetPlatform && this.voiceProfile.platformAdaptation[targetPlatform]) {
      const platformProfile = this.voiceProfile.platformAdaptation[targetPlatform];
      
      // Adjust length if needed
      if (adaptedContent.length > platformProfile.adaptedLength * 1.5) {
        adaptedContent = this.truncateToOptimalLength(adaptedContent, platformProfile.adaptedLength);
      }
      
      // Adjust emoji usage
      const shouldHaveEmoji = platformProfile.platformSpecificPatterns.emojiUsage > 0.3;
      if (shouldHaveEmoji && !/[\u{1F600}-\u{1F64F}]/u.test(adaptedContent)) {
        adaptedContent = this.addContextualEmoji(adaptedContent);
      }
    }

    // Apply user's personal style
    adaptedContent = this.applyPersonalStyle(adaptedContent);

    return adaptedContent;
  }

  private truncateToOptimalLength(content: string, targetLength: number): string {
    if (content.length <= targetLength) return content;
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length <= targetLength - 10) { // Leave room for ellipsis
        truncated += sentence + '.';
      } else {
        break;
      }
    }
    
    return truncated || content.substring(0, targetLength - 3) + '...';
  }

  private addContextualEmoji(content: string): string {
    const emojiMap = {
      success: '🎉',
      growth: '🌱',
      learning: '📚',
      motivation: '💪',
      achievement: '🏆',
      insight: '💡',
      progress: '📈',
      journey: '🚀'
    };

    let emojiContent = content;
    Object.entries(emojiMap).forEach(([keyword, emoji]) => {
      if (content.toLowerCase().includes(keyword) && !content.includes(emoji)) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        emojiContent = emojiContent.replace(regex, `${keyword} ${emoji}`);
      }
    });

    return emojiContent;
  }

  private applyPersonalStyle(content: string): string {
    if (!this.voiceProfile) return content;

    let styledContent = content;

    // Apply vocabulary preferences
    if (this.voiceProfile.vocabularyProfile.uniquePhrases.length > 0) {
      const randomPhrase = this.voiceProfile.vocabularyProfile.uniquePhrases[
        Math.floor(Math.random() * this.voiceProfile.vocabularyProfile.uniquePhrases.length)
      ];
      
      // Occasionally incorporate user's unique phrases
      if (Math.random() < 0.3 && !styledContent.toLowerCase().includes(randomPhrase)) {
        styledContent += `\n\n${randomPhrase.charAt(0).toUpperCase() + randomPhrase.slice(1)}.`;
      }
    }

    // Apply structure preference
    if (this.voiceProfile.contentPreferences.structurePreference === 'bullet-points' && 
        styledContent.includes('\n') && !styledContent.includes('•')) {
      const lines = styledContent.split('\n').filter(line => line.trim());
      if (lines.length > 2) {
        const bulletPoints = lines.slice(1).map(line => `• ${line.trim()}`);
        styledContent = `${lines[0]}\n\n${bulletPoints.join('\n')}`;
      }
    }

    return styledContent;
  }

  getVoiceProfile(): VoiceProfile | null {
    return this.voiceProfile;
  }

  getConfidence(): number {
    return this.voiceProfile?.confidence || 0;
  }

  getSuggestedImprovements(): string[] {
    if (!this.voiceProfile) return [];

    const suggestions = [];

    if (this.voiceProfile.confidence < 50) {
      suggestions.push('Create more authentic posts to improve voice learning accuracy');
    }

    if (this.voiceProfile.languagePatterns.questionUsage < 0.2) {
      suggestions.push('Try asking more questions to increase engagement');
    }

    if (this.voiceProfile.engagementPatterns.bestPerformingHashtagCount > 0 && 
        this.voiceProfile.languagePatterns.hashtagUsage < 0.3) {
      suggestions.push('Consider using more hashtags based on your best-performing content');
    }

    if (this.voiceProfile.languagePatterns.emojiUsage < 0.1) {
      suggestions.push('Add occasional emojis to make your content more engaging');
    }

    return suggestions;
  }
}

// Export singleton instance
export const VoiceLearning = new VoiceLearningService();