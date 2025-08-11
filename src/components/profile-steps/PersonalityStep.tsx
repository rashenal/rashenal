import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Star, 
  Eye, 
  Users, 
  Heart, 
  Target,
  Zap,
  Clock,
  MessageSquare,
  Award,
  Info,
  ExternalLink,
  CheckCircle,
  Circle
} from 'lucide-react';
import { UserProfile, PersonalityProfile } from '../../types/UserProfile';

interface PersonalityStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const myersBriggsTypes = {
  'ENFP': { name: 'The Campaigner', description: 'Enthusiastic, creative, and sociable free spirits.' },
  'INFP': { name: 'The Mediator', description: 'Poetic, kind, and altruistic, always eager to help good causes.' },
  'ENFJ': { name: 'The Protagonist', description: 'Charismatic and inspiring leaders, able to mesmerize listeners.' },
  'INFJ': { name: 'The Advocate', description: 'Creative and insightful, inspired and independent.' },
  'ENTP': { name: 'The Debater', description: 'Smart and curious thinkers who cannot resist an intellectual challenge.' },
  'INTP': { name: 'The Thinker', description: 'Innovative inventors with an unquenchable thirst for knowledge.' },
  'ENTJ': { name: 'The Commander', description: 'Bold, imaginative, and strong-willed leaders.' },
  'INTJ': { name: 'The Architect', description: 'Imaginative and strategic thinkers, with a plan for everything.' },
  'ESFP': { name: 'The Entertainer', description: 'Spontaneous, energetic, and enthusiastic people.' },
  'ISFP': { name: 'The Adventurer', description: 'Flexible and charming artists, always ready to explore possibilities.' },
  'ESFJ': { name: 'The Consul', description: 'Extraordinarily caring, social, and popular people.' },
  'ISFJ': { name: 'The Protector', description: 'Very dedicated and warm protectors, ready to defend loved ones.' },
  'ESTP': { name: 'The Entrepreneur', description: 'Smart, energetic, and perceptive people who enjoy living on the edge.' },
  'ISTP': { name: 'The Virtuoso', description: 'Bold and practical experimenters, masters of all kinds of tools.' },
  'ESTJ': { name: 'The Executive', description: 'Excellent administrators, unsurpassed at managing things or people.' },
  'ISTJ': { name: 'The Logistician', description: 'Practical and fact-minded, reliable and responsible.' }
};

const enneagramTypes = [
  { type: 1, name: 'The Perfectionist', description: 'Principled, purposeful, self-controlled, and perfectionistic.' },
  { type: 2, name: 'The Helper', description: 'Generous, demonstrative, people-pleasing, and possessive.' },
  { type: 3, name: 'The Achiever', description: 'Adaptable, excelling, driven, and image-conscious.' },
  { type: 4, name: 'The Individualist', description: 'Expressive, dramatic, self-absorbed, and temperamental.' },
  { type: 5, name: 'The Investigator', description: 'Intense, cerebral, perceptive, and innovative.' },
  { type: 6, name: 'The Loyalist', description: 'Engaging, responsible, anxious, and suspicious.' },
  { type: 7, name: 'The Enthusiast', description: 'Spontaneous, versatile, acquisitive, and scattered.' },
  { type: 8, name: 'The Challenger', description: 'Self-confident, decisive, willful, and confrontational.' },
  { type: 9, name: 'The Peacemaker', description: 'Receptive, reassuring, agreeable, and complacent.' }
];

const bigFiveTraits = [
  { 
    key: 'openness', 
    name: 'Openness to Experience',
    description: 'Curiosity, creativity, and willingness to try new things',
    low: 'Prefers routine and familiar experiences',
    high: 'Enjoys novelty, creativity, and abstract thinking'
  },
  { 
    key: 'conscientiousness', 
    name: 'Conscientiousness',
    description: 'Organization, discipline, and goal-directed behavior',
    low: 'Flexible, spontaneous, may struggle with organization',
    high: 'Organized, disciplined, and achievement-oriented'
  },
  { 
    key: 'extraversion', 
    name: 'Extraversion',
    description: 'Energy from social interaction and external stimulation',
    low: 'Prefers solitude, quiet environments, and reflection',
    high: 'Energized by social interaction and external activity'
  },
  { 
    key: 'agreeableness', 
    name: 'Agreeableness',
    description: 'Cooperation, trust, and consideration for others',
    low: 'Direct, skeptical, and competitive in nature',
    high: 'Cooperative, trusting, and considerate of others'
  },
  { 
    key: 'neuroticism', 
    name: 'Emotional Stability',
    description: 'Emotional resilience and stress management',
    low: 'Calm, emotionally stable, and stress-resistant',
    high: 'More sensitive to stress and emotional fluctuations'
  }
];

const strengthsList = [
  'Strategic Thinking', 'Communication', 'Leadership', 'Creativity', 'Problem Solving',
  'Empathy', 'Analytical Skills', 'Adaptability', 'Organization', 'Collaboration',
  'Innovation', 'Attention to Detail', 'Resilience', 'Time Management', 'Learning',
  'Mentoring', 'Project Management', 'Technical Skills', 'Networking', 'Persuasion'
];

export default function PersonalityStep({ profile, updateProfile, onNext, onPrev }: PersonalityStepProps) {
  const [currentSection, setCurrentSection] = useState<'overview' | 'myers-briggs' | 'big-five' | 'enneagram' | 'working-style'>('overview');
  const [showMBTIAssessment, setShowMBTIAssessment] = useState(false);
  
  const personalityProfile = profile.personality_profile || {} as PersonalityProfile;

  const handleInputChange = (field: string, value: any) => {
    const updatedProfile = { ...personalityProfile, [field]: value };
    updateProfile('personality_profile', updatedProfile);
  };

  const handleMyersBriggsChange = (field: string, value: any) => {
    const myersBriggs = personalityProfile.myers_briggs || {};
    const updatedMB = { ...myersBriggs, [field]: value };
    handleInputChange('myers_briggs', updatedMB);
  };

  const handleBigFiveChange = (trait: string, value: number) => {
    const bigFive = personalityProfile.big_five || {};
    const updatedBF = { ...bigFive, [trait]: value };
    handleInputChange('big_five', updatedBF);
  };

  const handleEnneagramChange = (field: string, value: any) => {
    const enneagram = personalityProfile.enneagram || {};
    const updatedEnum = { ...enneagram, [field]: value };
    handleInputChange('enneagram', updatedEnum);
  };

  const handleWorkingStyleChange = (field: string, value: any) => {
    const workingStyle = personalityProfile.working_style || {};
    const updatedWS = { ...workingStyle, [field]: value };
    handleInputChange('working_style', updatedWS);
  };

  const toggleStrength = (strength: string) => {
    const currentStrengths = personalityProfile.strengths || [];
    const updatedStrengths = currentStrengths.includes(strength)
      ? currentStrengths.filter(s => s !== strength)
      : [...currentStrengths, strength];
    handleInputChange('strengths', updatedStrengths);
  };

  // Calculate Myers-Briggs dimensions based on user input
  const calculateMBTIFromDimensions = () => {
    const dimensions = personalityProfile.myers_briggs?.dimensions;
    if (!dimensions) return '';
    
    const e_i = dimensions.extraversion_introversion > 0 ? 'E' : 'I';
    const s_n = dimensions.sensing_intuition > 0 ? 'N' : 'S';
    const t_f = dimensions.thinking_feeling > 0 ? 'F' : 'T';
    const j_p = dimensions.judging_perceiving > 0 ? 'P' : 'J';
    
    return `${e_i}${s_n}${t_f}${j_p}`;
  };

  const sections = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'myers-briggs', name: 'Myers-Briggs', icon: Users },
    { id: 'big-five', name: 'Big Five', icon: Star },
    { id: 'enneagram', name: 'Enneagram', icon: Target },
    { id: 'working-style', name: 'Working Style', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      
      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{section.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Section */}
      {currentSection === 'overview' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality Overview</h3>
            <p className="text-gray-600 mb-6">
              Understanding your personality helps us create more personalized AI interactions, 
              coaching styles, and content recommendations. All assessments are optional and 
              can be updated at any time.
            </p>
          </div>

          {/* Quick Assessment Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Brain className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Myers-Briggs Type Indicator</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Understand your preferences for how you perceive the world and make decisions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMBTIAssessment(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Take Assessment <ExternalLink className="h-4 w-4 ml-1" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Star className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Big Five Personality</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Explore the five major dimensions of personality traits.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentSection('big-five')}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Complete Assessment →
              </button>
            </div>
          </div>

          {/* Personal Strengths */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Personal Strengths</h4>
            <p className="text-sm text-gray-600 mb-4">
              Select your top strengths to help AI understand your capabilities and provide relevant opportunities.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {strengthsList.map(strength => (
                <button
                  key={strength}
                  onClick={() => toggleStrength(strength)}
                  className={`p-3 text-sm rounded-lg border transition-all text-left ${
                    personalityProfile.strengths?.includes(strength)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {strength}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Myers-Briggs Section */}
      {currentSection === 'myers-briggs' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Myers-Briggs Type Indicator</h3>
            <p className="text-gray-600 mb-4">
              If you know your MBTI type, select it below. Otherwise, you can take our assessment 
              or visit 16personalities.com for a comprehensive test.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your MBTI Type (if known)
              </label>
              <select
                value={personalityProfile.myers_briggs?.type || ''}
                onChange={(e) => handleMyersBriggsChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your type</option>
                {Object.entries(myersBriggsTypes).map(([type, info]) => (
                  <option key={type} value={type}>
                    {type} - {info.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <a
                href="https://www.16personalities.com/free-personality-test"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ExternalLink className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-900">Take Free Assessment</h4>
                    <p className="text-sm text-purple-700">Complete assessment at 16personalities.com</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {personalityProfile.myers_briggs?.type && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                {personalityProfile.myers_briggs.type} - {myersBriggsTypes[personalityProfile.myers_briggs.type as keyof typeof myersBriggsTypes]?.name}
              </h4>
              <p className="text-blue-700 text-sm">
                {myersBriggsTypes[personalityProfile.myers_briggs.type as keyof typeof myersBriggsTypes]?.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Big Five Section */}
      {currentSection === 'big-five' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Big Five Personality Assessment</h3>
            <p className="text-gray-600 mb-6">
              Rate yourself on each dimension from 0 (strongly disagree) to 100 (strongly agree).
            </p>
          </div>

          <div className="space-y-6">
            {bigFiveTraits.map(trait => (
              <div key={trait.key} className="bg-gray-50 rounded-xl p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{trait.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{trait.description}</p>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="text-xs text-gray-500 w-32">{trait.low}</span>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={personalityProfile.big_five?.[trait.key as keyof typeof personalityProfile.big_five] || 50}
                        onChange={(e) => handleBigFiveChange(trait.key, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-32 text-right">{trait.high}</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Score: {personalityProfile.big_five?.[trait.key as keyof typeof personalityProfile.big_five] || 50}/100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enneagram Section */}
      {currentSection === 'enneagram' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enneagram Type</h3>
            <p className="text-gray-600 mb-6">
              The Enneagram describes nine personality types and their motivations.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your Enneagram type (if known)
            </label>
            <div className="grid md:grid-cols-3 gap-3">
              {enneagramTypes.map(type => (
                <button
                  key={type.type}
                  onClick={() => handleEnneagramChange('type', type.type)}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    personalityProfile.enneagram?.type === type.type
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      personalityProfile.enneagram?.type === type.type
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {type.type}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{type.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Working Style Section */}
      {currentSection === 'working-style' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Working Style Preferences</h3>
            <p className="text-gray-600 mb-6">
              Understanding how you work best helps us tailor your AI coaching and productivity features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Peaks
              </label>
              <select
                value={personalityProfile.working_style?.prefers_morning_evening || ''}
                onChange={(e) => handleWorkingStyleChange('prefers_morning_evening', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select preference</option>
                <option value="morning">Morning person - peak energy AM</option>
                <option value="evening">Evening person - peak energy PM</option>
                <option value="flexible">Flexible - energy varies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Environment
              </label>
              <select
                value={personalityProfile.working_style?.works_better_alone_team || ''}
                onChange={(e) => handleWorkingStyleChange('works_better_alone_team', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select preference</option>
                <option value="alone">Work best alone - deep focus</option>
                <option value="team">Work best in teams - collaborative</option>
                <option value="hybrid">Hybrid - depends on task</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision Making
              </label>
              <select
                value={personalityProfile.working_style?.decision_making_style || ''}
                onChange={(e) => handleWorkingStyleChange('decision_making_style', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select style</option>
                <option value="quick">Quick decisions - trust instincts</option>
                <option value="deliberate">Deliberate - research thoroughly</option>
                <option value="collaborative">Collaborative - seek input</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Style
              </label>
              <select
                value={personalityProfile.working_style?.communication_style || ''}
                onChange={(e) => handleWorkingStyleChange('communication_style', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select style</option>
                <option value="direct">Direct - clear and concise</option>
                <option value="diplomatic">Diplomatic - considerate approach</option>
                <option value="supportive">Supportive - encouraging tone</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">How we use this information</h4>
            <p className="text-sm text-purple-700 mt-1">
              Your personality profile helps our AI provide more personalized coaching, 
              communication styles, and recommendations. This information is completely private 
              and only used to improve your experience with Rashenal AI.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <span>Continue to Preferences</span>
        </button>
      </div>
    </div>
  );
}