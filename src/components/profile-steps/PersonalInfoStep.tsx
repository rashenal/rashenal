import React, { useState } from 'react';
import { 
  Globe, 
  MapPin, 
  Calendar, 
  Users, 
  Heart,
  AlertCircle,
  Info
} from 'lucide-react';
import { UserProfile, PersonalInformation } from '../../types/UserProfile';

interface PersonalInfoStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' }
];

const pronounOptions = [
  'she/her',
  'he/him',
  'they/them',
  'she/they',
  'he/they',
  'ze/zir',
  'xe/xem',
  'prefer not to say',
  'other'
];

const culturalValues = [
  'Family',
  'Independence',
  'Community',
  'Achievement',
  'Tradition',
  'Innovation',
  'Spirituality',
  'Education',
  'Creativity',
  'Justice',
  'Harmony',
  'Adventure',
  'Security',
  'Freedom',
  'Authenticity',
  'Service',
  'Excellence',
  'Balance'
];

export default function PersonalInfoStep({ profile, updateProfile, onNext, onPrev }: PersonalInfoStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const personalInfo = profile.personal_info || {} as PersonalInformation;

  const handleInputChange = (field: string, value: any) => {
    const updatedInfo = { ...personalInfo, [field]: value };
    updateProfile('personal_info', updatedInfo);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationChange = (field: string, value: string) => {
    const location = personalInfo.location || {};
    const updatedLocation = { ...location, [field]: value };
    handleInputChange('location', updatedLocation);
  };

  const handleLanguageChange = (field: string, value: string[]) => {
    const languages = personalInfo.languages || { primary: 'en', fluent: ['en'] };
    const updatedLanguages = { ...languages, [field]: value };
    handleInputChange('languages', updatedLanguages);
  };

  const handleCultureChange = (field: string, value: string[]) => {
    const culture = personalInfo.culture || {};
    const updatedCulture = { ...culture, [field]: value };
    handleInputChange('culture', updatedCulture);
  };

  const addCulturalValue = (value: string) => {
    const currentValues = personalInfo.culture?.values || [];
    if (!currentValues.includes(value)) {
      handleCultureChange('values', [...currentValues, value]);
    }
  };

  const removeCulturalValue = (value: string) => {
    const currentValues = personalInfo.culture?.values || [];
    handleCultureChange('values', currentValues.filter(v => v !== value));
  };

  const validateStep = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!personalInfo.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!personalInfo.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Basic Information */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <span className="text-red-500 text-sm">*</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={personalInfo.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.first_name}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={personalInfo.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.last_name}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={personalInfo.display_name || ''}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="How you'd like to be addressed"
            />
            <p className="mt-1 text-xs text-gray-500">
              If different from your first name
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Pronouns (Optional)
            </label>
            <select
              value={personalInfo.preferred_pronouns || ''}
              onChange={(e) => handleInputChange('preferred_pronouns', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select pronouns</option>
              {pronounOptions.map(pronoun => (
                <option key={pronoun} value={pronoun}>{pronoun}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={personalInfo.date_of_birth || ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Helps us provide age-appropriate content
            </p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={personalInfo.location?.city || ''}
              onChange={(e) => handleLocationChange('city', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your city"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={personalInfo.location?.country || ''}
              onChange={(e) => handleLocationChange('country', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your country"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={personalInfo.location?.timezone || ''}
              onChange={(e) => handleLocationChange('timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select timezone</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Language
            </label>
            <select
              value={personalInfo.languages?.primary || 'en'}
              onChange={(e) => handleLanguageChange('primary', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fluent Languages
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {languages.map(lang => (
                <label key={lang.code} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={personalInfo.languages?.fluent?.includes(lang.code) || false}
                    onChange={(e) => {
                      const fluent = personalInfo.languages?.fluent || [];
                      const updated = e.target.checked
                        ? [...fluent, lang.code]
                        : fluent.filter(l => l !== lang.code);
                      handleLanguageChange('fluent', updated);
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{lang.flag} {lang.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Background */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cultural Background</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultural Background (Optional)
            </label>
            <textarea
              value={personalInfo.culture?.background || ''}
              onChange={(e) => handleCultureChange('background', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about your cultural background, heritage, or identity that's important to you..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Values
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Select the values that are most important to you. This helps us understand what motivates you.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {culturalValues.map(value => (
                <button
                  key={value}
                  onClick={() => {
                    const selected = personalInfo.culture?.values?.includes(value);
                    if (selected) {
                      removeCulturalValue(value);
                    } else {
                      addCulturalValue(value);
                    }
                  }}
                  className={`p-3 text-sm rounded-lg border transition-all ${
                    personalInfo.culture?.values?.includes(value)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Traditions & Practices (Optional)
            </label>
            <textarea
              value={personalInfo.culture?.traditions?.join('\n') || ''}
              onChange={(e) => handleCultureChange('traditions', e.target.value.split('\n').filter(t => t.trim()))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="List any cultural traditions, practices, or celebrations that are important to you (one per line)..."
            />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Why do we ask for this information?</h4>
            <p className="text-sm text-blue-700 mt-1">
              This information helps our AI create personalized content that respects your cultural background, 
              communicates in your preferred style, and understands your unique perspective. All information is optional 
              except for your name, and you can update it anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <span>Continue to Contact Information</span>
        </button>
      </div>
    </div>
  );
}