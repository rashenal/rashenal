import React from 'react';
import { Accessibility } from 'lucide-react';
import { UserProfile } from '../../types/UserProfile';

interface AccessibilityStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function AccessibilityStep({ profile, updateProfile, onNext, onPrev }: AccessibilityStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Accessibility className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibility Configuration</h3>
        <p className="text-gray-600">
          This comprehensive accessibility configuration will be implemented in the next phase.
          It will include visual, auditory, motor, and cognitive accessibility options.
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