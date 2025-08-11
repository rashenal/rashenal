import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Star,
  Plus,
  X,
  Home,
  Building,
  Users,
  Plane,
  Clock,
  Heart,
  TrendingUp,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';
import { WorkPreferences } from '../lib/database-types';

interface WorkPreferencesProps {
  preferences: WorkPreferences | null;
  onChange: (preferences: WorkPreferences) => void;
  className?: string;
}

const defaultPreferences: WorkPreferences = {
  remote_work: 'no_preference',
  company_size: 'no_preference',
  work_environment: 'no_preference',
  travel_requirements: 'no_preference',
  overtime_expectations: 'no_preference',
  deal_breakers: [],
  must_haves: [],
  preferred_benefits: [],
  work_life_balance_priority: 3,
  growth_opportunities_priority: 3,
  compensation_priority: 3,
  company_mission_priority: 3,
  technical_challenges_priority: 3
};

export default function WorkPreferencesComponent({ preferences, onChange, className = '' }: WorkPreferencesProps) {
  const [newDealBreaker, setNewDealBreaker] = useState('');
  const [newMustHave, setNewMustHave] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const prefs = preferences || defaultPreferences;

  const updatePreference = <K extends keyof WorkPreferences>(
    key: K,
    value: WorkPreferences[K]
  ) => {
    onChange({
      ...prefs,
      [key]: value
    });
  };

  const addDealBreaker = () => {
    if (newDealBreaker.trim()) {
      updatePreference('deal_breakers', [...prefs.deal_breakers, newDealBreaker.trim()]);
      setNewDealBreaker('');
    }
  };

  const removeDealBreaker = (index: number) => {
    updatePreference('deal_breakers', prefs.deal_breakers.filter((_, i) => i !== index));
  };

  const addMustHave = () => {
    if (newMustHave.trim()) {
      updatePreference('must_haves', [...prefs.must_haves, newMustHave.trim()]);
      setNewMustHave('');
    }
  };

  const removeMustHave = (index: number) => {
    updatePreference('must_haves', prefs.must_haves.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      updatePreference('preferred_benefits', [...prefs.preferred_benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    updatePreference('preferred_benefits', prefs.preferred_benefits.filter((_, i) => i !== index));
  };

  const commonDealBreakers = [
    'No remote work options',
    'Required weekend work',
    'Unpaid overtime',
    'No health insurance',
    'Toxic work culture',
    'Micromanagement',
    'No growth opportunities',
    'Below market salary',
    'Excessive travel (>50%)',
    'No work-life balance'
  ];

  const commonMustHaves = [
    'Health insurance',
    'Flexible work hours',
    'Professional development budget',
    'Remote work option',
    'Collaborative team environment',
    '401k matching',
    'Paid time off',
    'Mental health support',
    'Career advancement path',
    'Modern technology stack'
  ];

  const commonBenefits = [
    'Stock options/equity',
    'Gym membership',
    'Free meals/snacks',
    'Home office stipend',
    'Conference attendance budget',
    'Unlimited PTO',
    'Flexible spending account',
    'Commuter benefits',
    'Team building activities',
    'Learning subscriptions'
  ];

  const PrioritySlider = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    icon: React.ComponentType<any>;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <label className="text-sm font-medium text-gray-900">{label}</label>
        </div>
        <span className="text-sm font-medium text-purple-600">
          {value}/5
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Not Important</span>
        <span>Critical</span>
      </div>
    </div>
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Basic Work Preferences */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building className="h-5 w-5 text-blue-600 mr-2" />
          Work Environment Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Remote Work */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remote Work</label>
            <select
              value={prefs.remote_work}
              onChange={(e) => updatePreference('remote_work', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="no_preference">No Preference</option>
              <option value="required">Required (100% remote)</option>
              <option value="preferred">Preferred (mostly remote)</option>
              <option value="hybrid">Hybrid (2-3 days remote)</option>
              <option value="office_only">Office Only</option>
            </select>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
            <select
              value={prefs.company_size}
              onChange={(e) => updatePreference('company_size', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="no_preference">No Preference</option>
              <option value="startup">Startup (1-50 employees)</option>
              <option value="small">Small (51-200 employees)</option>
              <option value="medium">Medium (201-1000 employees)</option>
              <option value="large">Large (1001-5000 employees)</option>
              <option value="enterprise">Enterprise (5000+ employees)</option>
            </select>
          </div>

          {/* Work Environment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Style</label>
            <select
              value={prefs.work_environment}
              onChange={(e) => updatePreference('work_environment', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="no_preference">No Preference</option>
              <option value="collaborative">Collaborative Team Environment</option>
              <option value="independent">Independent/Autonomous Work</option>
              <option value="mixed">Mix of Both</option>
            </select>
          </div>

          {/* Travel Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Requirements</label>
            <select
              value={prefs.travel_requirements}
              onChange={(e) => updatePreference('travel_requirements', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="no_preference">No Preference</option>
              <option value="none">None (0%)</option>
              <option value="minimal">Minimal (1-10%)</option>
              <option value="moderate">Moderate (11-25%)</option>
              <option value="frequent">Frequent (25%+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deal Breakers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          Deal Breakers
        </h3>
        <p className="text-sm text-gray-600">
          Conditions that would make you decline a job offer immediately
        </p>

        <div className="space-y-3">
          {prefs.deal_breakers.map((dealBreaker, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-800">{dealBreaker}</span>
              <button
                onClick={() => removeDealBreaker(index)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex space-x-2">
            <input
              type="text"
              value={newDealBreaker}
              onChange={(e) => setNewDealBreaker(e.target.value)}
              placeholder="Add a deal breaker..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addDealBreaker()}
            />
            <button
              onClick={addDealBreaker}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Common:</span>
            {commonDealBreakers.filter(db => !prefs.deal_breakers.includes(db)).slice(0, 5).map(dealBreaker => (
              <button
                key={dealBreaker}
                onClick={() => updatePreference('deal_breakers', [...prefs.deal_breakers, dealBreaker])}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                + {dealBreaker}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Must Haves */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          Must Haves
        </h3>
        <p className="text-sm text-gray-600">
          Essential requirements for any position you'd consider
        </p>

        <div className="space-y-3">
          {prefs.must_haves.map((mustHave, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-800">{mustHave}</span>
              <button
                onClick={() => removeMustHave(index)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex space-x-2">
            <input
              type="text"
              value={newMustHave}
              onChange={(e) => setNewMustHave(e.target.value)}
              placeholder="Add a must-have..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addMustHave()}
            />
            <button
              onClick={addMustHave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Common:</span>
            {commonMustHaves.filter(mh => !prefs.must_haves.includes(mh)).slice(0, 5).map(mustHave => (
              <button
                key={mustHave}
                onClick={() => updatePreference('must_haves', [...prefs.must_haves, mustHave])}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                + {mustHave}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preferred Benefits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Star className="h-5 w-5 text-yellow-600 mr-2" />
          Nice to Have Benefits
        </h3>
        <p className="text-sm text-gray-600">
          Additional benefits that would make an offer more attractive
        </p>

        <div className="space-y-3">
          {prefs.preferred_benefits.map((benefit, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-800">{benefit}</span>
              <button
                onClick={() => removeBenefit(index)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex space-x-2">
            <input
              type="text"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a preferred benefit..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
            />
            <button
              onClick={addBenefit}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Common:</span>
            {commonBenefits.filter(b => !prefs.preferred_benefits.includes(b)).slice(0, 5).map(benefit => (
              <button
                key={benefit}
                onClick={() => updatePreference('preferred_benefits', [...prefs.preferred_benefits, benefit])}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                + {benefit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Priorities */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="h-5 w-5 text-purple-600 mr-2" />
          Job Priorities
        </h3>
        <p className="text-sm text-gray-600">
          Rate how important each factor is when evaluating job opportunities
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PrioritySlider
            label="Work-Life Balance"
            value={prefs.work_life_balance_priority}
            onChange={(value) => updatePreference('work_life_balance_priority', value as any)}
            icon={Heart}
          />

          <PrioritySlider
            label="Growth Opportunities"
            value={prefs.growth_opportunities_priority}
            onChange={(value) => updatePreference('growth_opportunities_priority', value as any)}
            icon={TrendingUp}
          />

          <PrioritySlider
            label="Compensation"
            value={prefs.compensation_priority}
            onChange={(value) => updatePreference('compensation_priority', value as any)}
            icon={DollarSign}
          />

          <PrioritySlider
            label="Company Mission"
            value={prefs.company_mission_priority}
            onChange={(value) => updatePreference('company_mission_priority', value as any)}
            icon={Target}
          />

          <PrioritySlider
            label="Technical Challenges"
            value={prefs.technical_challenges_priority}
            onChange={(value) => updatePreference('technical_challenges_priority', value as any)}
            icon={Zap}
          />
        </div>
      </div>
    </div>
  );
}