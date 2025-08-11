import React from 'react';
import { Shield, CheckCircle, Circle } from 'lucide-react';
import { UserProfile } from '../../types/UserProfile';

interface PrivacyStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PrivacyStep({ profile, updateProfile, onNext, onPrev }: PrivacyStepProps) {
  const privacySettings = profile.privacy_settings || {};

  const handlePrivacyChange = (field: string, value: any) => {
    const updatedSettings = { ...privacySettings, [field]: value };
    updateProfile('privacy_settings', updatedSettings);
  };

  const privacyOptions = [
    {
      key: 'data_collection_consent',
      title: 'Data Collection',
      description: 'Allow collection of usage data to improve your experience',
      required: false
    },
    {
      key: 'ai_training_consent',
      title: 'AI Training',
      description: 'Use your data to improve AI responses (data is anonymized)',
      required: false
    },
    {
      key: 'marketing_consent',
      title: 'Marketing Communications',
      description: 'Receive updates about new features and improvements',
      required: false
    },
    {
      key: 'analytics_consent',
      title: 'Analytics',
      description: 'Help us understand how you use the platform',
      required: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Privacy Settings</h3>
        </div>
        <p className="text-gray-600">
          Control how your data is used and shared. You can change these settings at any time.
        </p>
      </div>

      {/* Profile Visibility */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Profile Visibility</h4>
        <div className="space-y-2">
          {[
            { value: 'private', label: 'Private', description: 'Only you can see your profile' },
            { value: 'contacts_only', label: 'Contacts Only', description: 'Only people you connect with' },
            { value: 'public', label: 'Public', description: 'Anyone can view your profile' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handlePrivacyChange('profile_visibility', option.value)}
              className={`w-full p-4 border rounded-xl text-left transition-all ${
                privacySettings.profile_visibility === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">{option.label}</h5>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {privacySettings.profile_visibility === option.value ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Consent Options */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Data Usage Preferences</h4>
        <div className="space-y-3">
          {privacyOptions.map(option => (
            <label
              key={option.key}
              className="flex items-start space-x-3 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={privacySettings[option.key as keyof typeof privacySettings] || false}
                onChange={(e) => handlePrivacyChange(option.key, e.target.checked)}
                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{option.title}</h5>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Your Privacy Matters</h4>
        <p className="text-sm text-blue-700">
          We are committed to protecting your privacy. Your personal data is encrypted and never sold to third parties. 
          You have full control over your information and can delete your account at any time. 
          Read our full Privacy Policy for more details.
        </p>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all">
          Complete Profile Setup
        </button>
      </div>
    </div>
  );
}