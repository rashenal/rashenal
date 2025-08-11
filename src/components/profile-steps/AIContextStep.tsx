import React from 'react';
import { Bot } from 'lucide-react';
import { UserProfile } from '../../types/UserProfile';

interface AIContextStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function AIContextStep({ profile, updateProfile, onNext, onPrev }: AIContextStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Bot className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Context & Goals</h3>
        <p className="text-gray-600">
          This AI context system will be implemented in the next phase.
          It will include professional background, personal context, and AI interaction preferences.
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