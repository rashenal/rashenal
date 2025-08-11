import React from 'react';
import { Heart } from 'lucide-react';
import { UserProfile } from '../../types/UserProfile';

interface PreferencesStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PreferencesStep({ profile, updateProfile, onNext, onPrev }: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heart className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Preferences & Likes</h3>
        <p className="text-gray-600">
          This detailed preferences system will be implemented in the next phase.
          It will include interests, learning preferences, communication tone, and motivation styles.
        </p>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all">
          Continue →
        </button>
      </div>
    </div>
  );
}