/**
 * Comprehensive User Profile Types
 * Designed for AI context awareness and personalization
 */

export interface ContactInformation {
  email: string;
  phone?: string;
  whatsapp?: string;
  preferred_contact_method: 'email' | 'phone' | 'whatsapp' | 'app';
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
}

export interface PersonalInformation {
  first_name: string;
  last_name: string;
  display_name?: string;
  preferred_pronouns?: string;
  date_of_birth?: string;
  location?: {
    city: string;
    country: string;
    timezone: string;
  };
  languages: {
    primary: string;
    fluent: string[];
    learning?: string[];
  };
  culture: {
    background?: string;
    values?: string[];
    traditions?: string[];
  };
}

export interface AccessibilityNeeds {
  visual: {
    needs_high_contrast?: boolean;
    needs_large_text?: boolean;
    uses_screen_reader?: boolean;
    color_blind_type?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    preferred_font_size?: number;
  };
  auditory: {
    hearing_impaired?: boolean;
    needs_captions?: boolean;
    sensitive_to_sound?: boolean;
    preferred_volume?: number;
  };
  motor: {
    uses_assistive_device?: boolean;
    needs_larger_click_targets?: boolean;
    prefers_keyboard_navigation?: boolean;
    has_limited_dexterity?: boolean;
  };
  cognitive: {
    neurodivergent_type?: ('adhd' | 'autism' | 'dyslexia' | 'dyscalculia' | 'other')[];
    needs_simplified_interface?: boolean;
    prefers_step_by_step?: boolean;
    benefits_from_reminders?: boolean;
    processes_information_differently?: boolean;
    sensory_sensitivities?: string[];
  };
  other_needs?: string;
}

export interface PersonalityProfile {
  myers_briggs?: {
    type: string; // e.g., "ENFP"
    dimensions: {
      extraversion_introversion: number; // -100 to 100
      sensing_intuition: number;
      thinking_feeling: number;
      judging_perceiving: number;
    };
  };
  big_five?: {
    openness: number; // 0-100
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  enneagram?: {
    type: number; // 1-9
    wing?: number;
    instinct_stack?: string;
  };
  strengths?: string[];
  working_style?: {
    prefers_morning_evening: 'morning' | 'evening' | 'flexible';
    works_better_alone_team: 'alone' | 'team' | 'hybrid';
    decision_making_style: 'quick' | 'deliberate' | 'collaborative';
    communication_style: 'direct' | 'diplomatic' | 'supportive';
  };
}

export interface PreferencesAndLikes {
  interests: string[];
  hobbies: string[];
  favorite_topics: string[];
  learning_preferences: {
    visual?: boolean;
    auditory?: boolean;
    kinesthetic?: boolean;
    reading_writing?: boolean;
  };
  communication_tone: 'professional' | 'casual' | 'friendly' | 'encouraging' | 'direct';
  motivation_style: 'achievement' | 'affiliation' | 'power' | 'balanced';
  likes: {
    activities: string[];
    environments: string[];
    interaction_styles: string[];
    feedback_types: string[];
  };
  dislikes: {
    activities: string[];
    environments: string[];
    interaction_styles: string[];
    triggers?: string[];
  };
}

export interface AIContextData {
  professional_background?: {
    current_role?: string;
    industry?: string;
    experience_level?: 'entry' | 'mid' | 'senior' | 'executive' | 'student';
    skills: string[];
    goals: string[];
    challenges: string[];
  };
  personal_context?: {
    life_stage?: 'student' | 'early_career' | 'established' | 'transitioning' | 'retired';
    family_situation?: string;
    major_life_events?: string[];
    current_priorities?: string[];
    stress_factors?: string[];
    support_systems?: string[];
  };
  ai_interaction_preferences?: {
    preferred_coaching_style: 'directive' | 'collaborative' | 'supportive' | 'challenging';
    feedback_frequency: 'immediate' | 'daily' | 'weekly' | 'as_needed';
    privacy_level: 'open' | 'moderate' | 'private';
    data_sharing_comfort: 'high' | 'medium' | 'low';
  };
  custom_context?: {
    key_phrases?: string[];
    important_relationships?: string[];
    values_and_beliefs?: string[];
    personal_mission?: string;
    free_form_context?: string;
  };
}

export interface MediaAssets {
  profile_images: {
    id: string;
    url: string;
    is_primary: boolean;
    upload_date: string;
    alt_text?: string;
  }[];
  avatar_assets?: {
    photos_for_avatar: {
      id: string;
      url: string;
      upload_date: string;
      usage_rights: 'ai_training' | 'avatar_only' | 'restricted';
    }[];
    audio_samples?: {
      id: string;
      url: string;
      duration: number;
      sample_type: 'greeting' | 'conversation' | 'reading' | 'other';
      upload_date: string;
      transcription?: string;
    }[];
    video_samples?: {
      id: string;
      url: string;
      duration: number;
      sample_type: 'introduction' | 'presentation' | 'casual' | 'other';
      upload_date: string;
      thumbnail_url?: string;
    }[];
  };
}

export interface UserProfile {
  id: string;
  user_id: string;
  personal_info: PersonalInformation;
  contact_info: ContactInformation;
  accessibility_needs: AccessibilityNeeds;
  personality_profile: PersonalityProfile;
  preferences: PreferencesAndLikes;
  ai_context: AIContextData;
  media_assets: MediaAssets;
  privacy_settings: {
    profile_visibility: 'public' | 'private' | 'contacts_only';
    data_collection_consent: boolean;
    ai_training_consent: boolean;
    marketing_consent: boolean;
    analytics_consent: boolean;
  };
  created_at: string;
  updated_at: string;
  last_profile_review?: string;
  profile_completion_percentage: number;
}

// Helper types for form validation
export interface ProfileFormErrors {
  [key: string]: string | undefined;
}

export interface ProfileSectionCompletion {
  personal_info: boolean;
  contact_info: boolean;
  accessibility_needs: boolean;
  personality_profile: boolean;
  preferences: boolean;
  ai_context: boolean;
  media_assets: boolean;
}

// Default values
export const defaultUserProfile = (): Partial<UserProfile> => ({
  personal_info: {
    first_name: '',
    last_name: '',
    languages: {
      primary: 'en',
      fluent: ['en']
    },
    culture: {
      values: [],
      traditions: []
    }
  },
  contact_info: {
    email: '',
    preferred_contact_method: 'email'
  },
  accessibility_needs: {
    visual: {},
    auditory: {},
    motor: {},
    cognitive: {}
  },
  personality_profile: {},
  preferences: {
    interests: [],
    hobbies: [],
    favorite_topics: [],
    learning_preferences: {},
    communication_tone: 'friendly',
    motivation_style: 'balanced',
    likes: {
      activities: [],
      environments: [],
      interaction_styles: [],
      feedback_types: []
    },
    dislikes: {
      activities: [],
      environments: [],
      interaction_styles: []
    }
  },
  ai_context: {
    ai_interaction_preferences: {
      preferred_coaching_style: 'supportive',
      feedback_frequency: 'daily',
      privacy_level: 'moderate',
      data_sharing_comfort: 'medium'
    },
    custom_context: {}
  },
  media_assets: {
    profile_images: []
  },
  privacy_settings: {
    profile_visibility: 'private',
    data_collection_consent: false,
    ai_training_consent: false,
    marketing_consent: false,
    analytics_consent: false
  },
  profile_completion_percentage: 0
});