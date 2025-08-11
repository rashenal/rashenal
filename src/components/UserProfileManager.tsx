import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Contact,
  Accessibility,
  Brain,
  Heart,
  Bot,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Save,
  Eye,
  EyeOff,
  Upload,
  X,
  Star,
  Globe,
  Shield,
  Settings,
  Sparkles
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { UserProfile, defaultUserProfile, ProfileSectionCompletion } from '../types/UserProfile';

// Step components
import PersonalInfoStep from './profile-steps/PersonalInfoStep';
import ContactInfoStep from './profile-steps/ContactInfoStep';
import AccessibilityStep from './profile-steps/AccessibilityStep';
import PersonalityStep from './profile-steps/PersonalityStep';
import PreferencesStep from './profile-steps/PreferencesStep';
import AIContextStep from './profile-steps/AIContextStep';
import MediaAssetsStep from './profile-steps/MediaAssetsStep';
import PrivacyStep from './profile-steps/PrivacyStep';

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  required: boolean;
}

export default function UserProfileManager() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>(() => {
    // Load from localStorage or use defaults
    const savedProfile = localStorage.getItem(`profile_${user?.id}`);
    return savedProfile ? JSON.parse(savedProfile) : defaultUserProfile();
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProfileSectionCompletion>({
    personal_info: false,
    contact_info: false,
    accessibility_needs: false,
    personality_profile: false,
    preferences: false,
    ai_context: false,
    media_assets: false
  });

  const profileSteps: ProfileStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic details about yourself',
      icon: User,
      component: PersonalInfoStep,
      required: true
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'How we can reach you',
      icon: Contact,
      component: ContactInfoStep,
      required: true
    },
    {
      id: 'accessibility',
      title: 'Accessibility Needs',
      description: 'Customize your experience',
      icon: Accessibility,
      component: AccessibilityStep,
      required: false
    },
    {
      id: 'personality',
      title: 'Personality Profile',
      description: 'Understanding your unique traits',
      icon: Brain,
      component: PersonalityStep,
      required: false
    },
    {
      id: 'preferences',
      title: 'Likes & Preferences',
      description: 'What motivates and engages you',
      icon: Heart,
      component: PreferencesStep,
      required: false
    },
    {
      id: 'ai_context',
      title: 'AI Context & Goals',
      description: 'Help AI understand your journey',
      icon: Bot,
      component: AIContextStep,
      required: false
    },
    {
      id: 'media',
      title: 'Photos & Media',
      description: 'Profile images and AI training assets',
      icon: Camera,
      component: MediaAssetsStep,
      required: false
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Control your data and visibility',
      icon: Shield,
      component: PrivacyStep,
      required: true
    }
  ];

  // Calculate completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    const sections = Object.keys(completionStatus);
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  }, [completionStatus]);

  // Update completion status based on profile data
  useEffect(() => {
    const newStatus: ProfileSectionCompletion = {
      personal_info: !!(profile.personal_info?.first_name && profile.personal_info?.last_name),
      contact_info: !!(profile.contact_info?.email),
      accessibility_needs: !!(Object.keys(profile.accessibility_needs || {}).length > 0),
      personality_profile: !!(profile.personality_profile?.myers_briggs?.type || 
                             profile.personality_profile?.big_five?.openness),
      preferences: !!(profile.preferences?.interests?.length || profile.preferences?.hobbies?.length),
      ai_context: !!(profile.ai_context?.professional_background?.current_role || 
                    profile.ai_context?.custom_context?.personal_mission),
      media_assets: !!(profile.media_assets?.profile_images?.length || 0) > 0
    };
    
    setCompletionStatus(newStatus);
    
    // Update profile with completion percentage
    const completionPercentage = Math.round(
      (Object.values(newStatus).filter(Boolean).length / Object.keys(newStatus).length) * 100
    );
    
    setProfile(prev => ({
      ...prev,
      profile_completion_percentage: completionPercentage,
      updated_at: new Date().toISOString()
    }));
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Save to localStorage (in real app, this would be Supabase)
      const profileToSave: UserProfile = {
        id: `profile_${user.id}`,
        user_id: user.id,
        ...profile,
        updated_at: new Date().toISOString(),
        created_at: profile.created_at || new Date().toISOString()
      } as UserProfile;
      
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileToSave));
      
      // In real implementation, save to Supabase
      console.log('✅ Profile saved successfully:', profileToSave);
      
      // Show success feedback
      setTimeout(() => setIsSaving(false), 1000);
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < profileSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const updateProfile = (section: string, data: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        ...data
      }
    }));
  };

  const CurrentStepComponent = profileSteps[currentStep]?.component;
  const currentStepData = profileSteps[currentStep];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to manage your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Rashenal Profile</h1>
          <p className="text-xl text-gray-600 mb-4">
            Help us create a personalized AI experience just for you
          </p>
          
          {/* Progress indicator */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Profile Completion</span>
              <span>{calculateCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Step Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Sections</h3>
              
              <nav className="space-y-2">
                {profileSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = completionStatus[step.id as keyof ProfileSectionCompletion];
                  const isAccessible = index === 0 || completionStatus[profileSteps[index - 1]?.id as keyof ProfileSectionCompletion] || !profileSteps[index - 1]?.required;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isAccessible && goToStep(index)}
                      disabled={!isAccessible}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : isCompleted
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : isAccessible
                          ? 'hover:bg-gray-100 text-gray-700'
                          : 'text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                          {step.title}
                        </p>
                        {step.required && (
                          <span className="text-xs opacity-75">Required</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="text-sm">{showPreview ? 'Hide' : 'Preview'} Profile</span>
                </button>
                
                <button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span className="text-sm">{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg">
              
              {/* Step Header */}
              <div className="px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <currentStepData.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h2>
                      <p className="text-gray-600">{currentStepData.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Step {currentStep + 1} of {profileSteps.length}
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="px-8 py-8">
                {CurrentStepComponent && (
                  <CurrentStepComponent
                    profile={profile}
                    updateProfile={updateProfile}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}
              </div>

              {/* Step Navigation Footer */}
              <div className="px-8 py-6 border-t bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {profileSteps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStep(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentStep
                            ? 'bg-blue-600'
                            : index < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={currentStep === profileSteps.length - 1 ? saveProfile : nextStep}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <span>
                      {currentStep === profileSteps.length - 1 ? 'Complete Profile' : 'Next'}
                    </span>
                    {currentStep === profileSteps.length - 1 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Profile Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}