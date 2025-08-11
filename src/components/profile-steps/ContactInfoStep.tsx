import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Shield, 
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { UserProfile, ContactInformation } from '../../types/UserProfile';

interface ContactInfoStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const contactMethods = [
  { value: 'email', label: 'Email', icon: Mail, description: 'Receive updates via email' },
  { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Phone calls for important updates' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Quick messages and reminders' },
  { value: 'app', label: 'In-App Only', icon: Shield, description: 'Notifications within the app only' }
];

export default function ContactInfoStep({ profile, updateProfile, onNext, onPrev }: ContactInfoStepProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const contactInfo = profile.contact_info || {} as ContactInformation;

  const handleInputChange = (field: string, value: any) => {
    const updatedInfo = { ...contactInfo, [field]: value };
    updateProfile('contact_info', updatedInfo);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    const emergencyContact = contactInfo.emergency_contact || {};
    const updatedEmergencyContact = { ...emergencyContact, [field]: value };
    handleInputChange('emergency_contact', updatedEmergencyContact);
  };

  const validateStep = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!contactInfo.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (contactInfo.phone && !/^\+?[\d\s\-\(\)]+$/.test(contactInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (contactInfo.whatsapp && !/^\+?[\d\s\-\(\)]+$/.test(contactInfo.whatsapp)) {
      newErrors.whatsapp = 'Please enter a valid WhatsApp number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Simple phone number formatting
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <div className="space-y-8">
      
      {/* Primary Contact Information */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Primary Contact Information</h3>
          <span className="text-red-500 text-sm">*</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                value={contactInfo.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will be your primary login email and for important notifications
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={contactInfo.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={(e) => handleInputChange('phone', formatPhoneNumber(e.target.value))}
                className={`w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={contactInfo.whatsapp || ''}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                onBlur={(e) => handleInputChange('whatsapp', formatPhoneNumber(e.target.value))}
                className={`w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              <MessageCircle className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.whatsapp}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              For quick reminders and habit notifications
            </p>
          </div>
        </div>
      </div>

      {/* Preferred Contact Method */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Communication Preferences</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you prefer to receive notifications and updates?
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {contactMethods.map(method => {
              const Icon = method.icon;
              const isSelected = contactInfo.preferred_contact_method === method.value;
              
              return (
                <button
                  key={method.value}
                  onClick={() => handleInputChange('preferred_contact_method', method.value)}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {method.label}
                        {isSelected && <CheckCircle className="inline-block h-4 w-4 ml-1 text-blue-600" />}
                      </h4>
                      <p className={`text-xs mt-1 ${
                        isSelected ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Emergency Contact (Optional)</h3>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-orange-800">
            <strong>Optional but recommended:</strong> This person would be contacted in case of extended 
            inactivity or if you've set up wellness check features. This information is kept completely private 
            and secure.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={contactInfo.emergency_contact?.name || ''}
              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emergency contact's full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship
            </label>
            <select
              value={contactInfo.emergency_contact?.relationship || ''}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select relationship</option>
              <option value="spouse">Spouse/Partner</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={contactInfo.emergency_contact?.phone || ''}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              onBlur={(e) => handleEmergencyContactChange('phone', formatPhoneNumber(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={contactInfo.emergency_contact?.email || ''}
              onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="emergency.contact@example.com"
            />
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">Privacy & Security</h4>
            <p className="text-sm text-gray-600 mt-1">
              All contact information is encrypted and stored securely. We'll only use your contact details 
              for the purposes you've specified and will never share them with third parties without your 
              explicit consent. You can update or remove this information at any time.
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
          ← Back to Personal Information
        </button>
        
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <span>Continue to Accessibility</span>
        </button>
      </div>
    </div>
  );
}