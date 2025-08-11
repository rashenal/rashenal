import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Upload, 
  FileText, 
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Loader,
  Share2,
  Copy,
  ExternalLink,
  CheckCircle,
  Save,
  ChevronUp,
  ChevronDown,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import DatabaseMigrationHelper from './DatabaseMigrationHelper';
import { JobProfile } from '../lib/database-types';
import { JobFinderService } from '../lib/job-finder-service';
import { RealClaudeCVParser, ComprehensiveCV, CVProcessingProgress } from '../lib/real-claude-cv-parser';
import ComprehensiveCVEditor from './ComprehensiveCVEditor';

interface JobProfileManagerProps {
  className?: string;
}

interface ExtractedCVData {
  extractedData: ComprehensiveCV;
  file: File;
}

export default function JobProfileManager({ className = '' }: JobProfileManagerProps) {
  // Core state
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState<CVProcessingProgress | null>(null);
  const [extractedCV, setExtractedCV] = useState<ExtractedCVData | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState<JobProfile | null>(null);
  
  // Debug state - TEMPORARY
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [formData, setFormData] = useState<Partial<JobProfile>>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    summary: '',
    skills: [],
    is_active: true
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profiles on mount
  useEffect(() => {
    console.log('JobProfileManager: Component mounted, loading profiles...');
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('JobProfileManager: Getting authenticated user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('JobProfileManager: Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        console.error('JobProfileManager: No user found');
        throw new Error('Not authenticated');
      }

      console.log('JobProfileManager: User authenticated, fetching profiles...');
      const profiles = await JobFinderService.getProfiles(user.id);
      console.log('JobProfileManager: Loaded profiles:', profiles);
      
      setProfiles(profiles);
    } catch (err) {
      console.error('JobProfileManager: Error loading profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  // REAL Claude AI CV processing
  const processCVFile = async (file: File): Promise<ComprehensiveCV> => {
    console.log('JobProfileManager: Processing CV file with REAL Claude AI parser:', file.name);
    
    // Set up progress callback
    RealClaudeCVParser.setProgressCallback((progress: CVProcessingProgress) => {
      console.log('JobProfileManager: Claude AI processing progress:', progress);
      setProcessingProgress(progress);
    });
    
    try {
      const extractedData = await RealClaudeCVParser.extractFromFile(file);
      console.log('JobProfileManager: Claude AI CV processed successfully:', extractedData);
      return extractedData;
    } catch (error) {
      console.error('JobProfileManager: Claude AI CV processing failed:', error);
      throw error;
    } finally {
      setProcessingProgress(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    console.log('JobProfileManager: File upload started:', file.name, file.type, file.size);
    
    if (!file) {
      console.warn('JobProfileManager: No file provided');
      return;
    }

    // Validate file type - now accepting TXT files for better reliability
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Please upload a PDF, DOC, DOCX, or TXT file. For best results, save your CV as a TXT file.';
      console.error('JobProfileManager: Invalid file type:', file.type);
      setError(errorMsg);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File size must be less than 10MB.';
      console.error('JobProfileManager: File too large:', file.size);
      setError(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Process CV with intelligent parser
      const extractedData = await processCVFile(file);
      
      // Set extracted CV data
      setExtractedCV({ extractedData, file });
      
      console.log('🔄 JobProfileManager: Mapping extracted data to form...');
      console.log('📋 Original extracted data:', extractedData);
      console.log('👤 Personal info being mapped:', extractedData.personalInfo);
      
      // Set form data from Claude AI extracted information
      const mappedFormData = {
        name: extractedData.personalInfo.name,
        email: extractedData.personalInfo.email || '',
        phone: extractedData.personalInfo.phone || '',
        location: extractedData.personalInfo.location || '',
        bio: extractedData.professionalSummary,
        summary: extractedData.experience[0]?.jobTitle || 'Professional',
        skills: [
          ...extractedData.skills.technical,
          ...extractedData.skills.leadership,
          ...extractedData.skills.business,
          ...extractedData.skills.languages || [],
          ...extractedData.skills.other || []
        ].slice(0, 20), // Limit to 20 skills for the basic form
        is_active: true
      };
      
      console.log('📝 Mapped form data:', mappedFormData);
      console.log('✅ Form fields being set:');
      console.log('   👤 Name:', mappedFormData.name);
      console.log('   📧 Email:', mappedFormData.email);
      console.log('   📱 Phone:', mappedFormData.phone);
      console.log('   📍 Location:', mappedFormData.location);
      console.log('   💼 Summary:', mappedFormData.summary);
      console.log('   🎯 Skills count:', mappedFormData.skills.length);
      
      setFormData(mappedFormData);
      
      setUploadedFile(file);
      setShowForm(true);
      
      const confidence = calculateConfidence(extractedData);
      const confidenceText = confidence >= 80 ? 'high' : 
                           confidence >= 60 ? 'good' : 'moderate';
      setSuccess(`🤖 Claude AI processed your CV with ${confidenceText} confidence (${confidence}%)! Review and edit the information below.`);
      
    } catch (err) {
      console.error('JobProfileManager: Error processing CV:', err);
      console.error('JobProfileManager: Full error details:', JSON.stringify(err, null, 2));
      
      // Provide detailed error information based on error type
      let errorMessage = 'CV processing failed. Please fill out the form manually.';
      let showForm = true;
      
      if (err instanceof Error) {
        console.log('JobProfileManager: Error message analysis:', err.message);
        
        if (err.message.includes('PDF processing not fully implemented') || err.message.includes('binary data')) {
          errorMessage = '📄 PDF processing requires specialized parsing. To extract YOUR real CV data (not sample data): Save your CV as a TXT file and upload that instead.';
        } else if (err.message.includes('Word document processing not fully implemented') || err.message.includes('binary format')) {
          errorMessage = '📄 Word document processing requires specialized parsing. To extract YOUR real CV data (not sample data): Save your CV as a TXT file and upload that instead.';
        } else if (err.message.includes('insufficient content') || err.message.includes('too short')) {
          errorMessage = '📄 Could not extract enough text from your file. Please save your CV as a TXT file for accurate extraction of YOUR data.';
        } else if (err.message.includes('Unsupported file type')) {
          errorMessage = '❌ File type not supported. Please upload a TXT file for best results.';
        } else if (err.message.includes('timeout')) {
          errorMessage = '🤖 Claude AI request timed out. Please try again or fill out the form manually.';
        } else if (err.message.includes('API key')) {
          errorMessage = '🤖 Claude AI is temporarily unavailable. Please fill out the form manually.';
        } else if (err.message.includes('Network')) {
          errorMessage = '🌐 Network error. Please check your connection and try again.';
        } else if (err.message.includes('Edge Function')) {
          errorMessage = '🤖 Claude AI service is temporarily unavailable. Please fill out the form manually.';
        } else {
          errorMessage = `❌ Processing failed: ${err.message}`;
        }
      }
      
      // Always show the form for manual entry as fallback
      setUploadedFile(file);
      setShowForm(showForm);
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        summary: '',
        skills: [],
        is_active: true
      });
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  // Handle form submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('JobProfileManager: Saving profile:', formData);
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingProfile) {
        // Update existing profile
        console.log('JobProfileManager: Updating profile:', editingProfile.id);
        await JobFinderService.updateProfile(editingProfile.id, formData);
        setSuccess('Profile updated successfully!');
      } else {
        // Create new profile
        console.log('JobProfileManager: Creating new profile');
        await JobFinderService.createProfile(formData);
        setSuccess('Profile created successfully!');
      }

      // Reset and reload
      resetForm();
      await loadProfiles();
      
    } catch (err) {
      console.error('JobProfileManager: Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (profile: JobProfile) => {
    console.log('JobProfileManager: Editing profile:', profile.id);
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      summary: profile.summary || '',
      skills: profile.skills || [],
      is_active: profile.is_active
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    console.log('JobProfileManager: Deleting profile:', profileId);
    
    try {
      await JobFinderService.deleteProfile(profileId);
      setSuccess('Profile deleted successfully!');
      await loadProfiles();
    } catch (err) {
      console.error('JobProfileManager: Error deleting profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  // Reset form
  const resetForm = () => {
    console.log('JobProfileManager: Resetting form');
    setShowForm(false);
    setShowAdvancedForm(false);
    setEditingProfile(null);
    setUploadedFile(null);
    setExtractedCV(null);
    setProcessingProgress(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      summary: '',
      skills: [],
      is_active: true
    });
  };

  // Handle skills input
  const handleSkillsInput = (value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => ({ ...prev, skills }));
  };

  // Calculate confidence score for Claude AI extraction
  const calculateConfidence = (data: ComprehensiveCV): number => {
    let score = 0;
    let factors = 0;
    
    // Use the built-in confidence score from the comprehensive CV
    return data.confidence.overall;
  };

  // Generate share link
  const generateShareLink = (profileId: string): string => {
    return `${window.location.origin}/profile/share/${profileId}`;
  };

  // Copy share link
  const copyShareLink = async (profileId: string) => {
    try {
      await navigator.clipboard.writeText(generateShareLink(profileId));
      setSuccess('Share link copied to clipboard!');
    } catch (err) {
      console.error('JobProfileManager: Error copying link:', err);
      setError('Failed to copy link');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-secondary">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <User className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
          Professional Profiles
        </h2>
        
        <div className="flex items-center space-x-3">
          {/* TEMPORARY: Database Diagnostics Button */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg 
              hover:bg-red-700 transition-colors font-medium text-sm"
            title="Temporary tool to fix foreign key constraint error"
          >
            <Database className="h-4 w-4" />
            <span>Fix DB Issue</span>
          </button>
          
          {!showForm && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg 
                hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Upload className="h-5 w-5" />
              <span>Upload CV to Create Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* TEMPORARY: Database Diagnostics Tool */}
      {showDiagnostics && (
        <div className="mb-6">
          <DatabaseMigrationHelper />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
          rounded-lg flex items-start space-x-2" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
          rounded-lg flex items-start space-x-2" role="alert">
          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Success</p>
            <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* CV Upload Zone - Only show when no form is visible */}
      {!showForm && (
        <div className="bg-primary rounded-xl p-8 shadow-sm">
          <div className="text-center">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 transition-colors cursor-pointer ${
                dragActive
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading || processingProgress ? (
                <div className="flex flex-col items-center">
                  <Loader className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-lg font-medium text-primary mb-2">
                    {processingProgress?.message || 'Processing your CV...'}
                  </p>
                  <p className="text-sm text-secondary mb-3">
                    Stage: {processingProgress?.stage || 'initializing'}
                  </p>
                  {processingProgress && (
                    <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress.progress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-tertiary">
                    {processingProgress?.progress || 0}% complete
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Upload Your CV to Get Started
                  </h3>
                  <p className="text-secondary mb-4 max-w-md">
                    🤖 Claude AI will extract your real CV data for accurate profile creation
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      ✅ For best results: Save your CV as a TXT file
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      This ensures your actual CV content is extracted, not sample data
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-tertiary mb-2">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      TXT (recommended), PDF, DOC, DOCX
                    </span>
                    <span>•</span>
                    <span>Up to 10MB</span>
                  </div>
                  <p className="text-xs text-tertiary">
                    🤖 Powered by Claude AI. TXT files work best for accurate data extraction.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      {showForm && (
        <div className="bg-primary rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary flex items-center">
              {uploadedFile && <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />}
              {editingProfile ? 'Edit Profile' : 'Review Your Profile'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-secondary hover:text-primary transition-colors"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* CV Processing Results */}
          {uploadedFile && extractedCV && (
            <div className="mb-6 space-y-4">
              {/* File Info */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>CV processed: {uploadedFile.name}</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    🤖 Claude AI Confidence: {calculateConfidence(extractedCV.extractedData)}%
                  </div>
                </div>
              </div>
              
              {/* Claude AI Processing Results */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center">
                  🤖 Claude AI Extraction Results
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Name:</span>
                    <span className="text-green-600 dark:text-green-400">{extractedCV.extractedData.personalInfo.name ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Email:</span>
                    <span className="text-green-600 dark:text-green-400">{extractedCV.extractedData.personalInfo.email ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Experience:</span>
                    <span className="text-green-600 dark:text-green-400">{extractedCV.extractedData.experience.length > 0 ? `${extractedCV.extractedData.experience.length} jobs` : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Education:</span>
                    <span className="text-green-600 dark:text-green-400">{extractedCV.extractedData.education.length > 0 ? `${extractedCV.extractedData.education.length} entries` : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Skills:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {(() => {
                        const totalSkills = (extractedCV.extractedData.skills.technical?.length || 0) +
                                          (extractedCV.extractedData.skills.leadership?.length || 0) +
                                          (extractedCV.extractedData.skills.business?.length || 0);
                        return totalSkills > 0 ? `${totalSkills} skills` : '✗';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Summary:</span>
                    <span className="text-green-600 dark:text-green-400">{extractedCV.extractedData.professionalSummary ? '✓' : '✗'}</span>
                  </div>
                </div>
                
                {/* Additional extracted info */}
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Claude AI Extracted Details:</p>
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    {extractedCV.extractedData.personalInfo.email && (
                      <div>📧 Email: {extractedCV.extractedData.personalInfo.email}</div>
                    )}
                    {extractedCV.extractedData.personalInfo.phone && (
                      <div>📱 Phone: {extractedCV.extractedData.personalInfo.phone}</div>
                    )}
                    {extractedCV.extractedData.personalInfo.location && (
                      <div>📍 Location: {extractedCV.extractedData.personalInfo.location}</div>
                    )}
                    {extractedCV.extractedData.experience.length > 0 && (
                      <div>💼 Experience: {extractedCV.extractedData.experience.length} roles found</div>
                    )}
                    {extractedCV.extractedData.education.length > 0 && (
                      <div>🎓 Education: {extractedCV.extractedData.education.length} qualifications</div>
                    )}
                    {extractedCV.extractedData.qualifications.length > 0 && (
                      <div>🏆 Certifications: {extractedCV.extractedData.qualifications.length} qualifications</div>
                    )}
                    <div>⚡ Processed: {new Date(extractedCV.extractedData.extractionMetadata.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b border-secondary pb-2">
                Contact Information
              </h3>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            {/* Professional Title */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Professional Title *
              </label>
              <input
                type="text"
                required
                value={formData.summary || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Senior Software Engineer, Product Manager"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Professional Summary *
              </label>
              <textarea
                required
                rows={4}
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Write 2-3 sentences about your professional background and expertise"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Key Skills
                {extractedCV && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    🤖 ({extractedCV.extractedData.skills.length} skills detected by Claude AI)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={formData.skills?.join(', ') || ''}
                onChange={(e) => handleSkillsInput(e.target.value)}
                className="w-full px-4 py-3 border border-secondary bg-primary text-primary 
                  rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="JavaScript, React, Python, Project Management (comma separated)"
              />
              <p className="text-xs text-tertiary mt-1">
                List your most relevant skills, separated by commas
              </p>
              
              {/* Show Claude AI extracted skills as suggestions */}
              {extractedCV && extractedCV.extractedData.skills.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-secondary mb-2">🤖 Skills detected by Claude AI:</p>
                  <div className="flex flex-wrap gap-1">
                    {extractedCV.extractedData.skills.map((skill, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const currentSkills = formData.skills || [];
                          if (!currentSkills.includes(skill)) {
                            setFormData(prev => ({ 
                              ...prev, 
                              skills: [...currentSkills, skill] 
                            }));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 
                          text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 
                          dark:hover:bg-purple-900/50 transition-colors"
                        title="Click to add this skill"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Form Toggle */}
            {extractedCV && (
              <div className="border-t border-secondary pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Detailed CV Information</h3>
                    <p className="text-sm text-secondary">
                      Edit your work experience, education, and qualifications in detail
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                      hover:bg-blue-700 transition-colors text-sm"
                  >
                    {showAdvancedForm ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span>Hide Details</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span>Edit Experience & Education</span>
                      </>
                    )}
                  </button>
                </div>
                
                {showAdvancedForm && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                    <ComprehensiveCVEditor
                      cvData={extractedCV.extractedData}
                      onUpdate={(updatedCV) => setExtractedCV({ ...extractedCV, extractedData: updatedCV })}
                      onSave={() => {
                        // Update form data from comprehensive CV
                        const updated = extractedCV.extractedData;
                        setFormData(prev => ({
                          ...prev,
                          name: updated.personalInfo.name,
                          email: updated.personalInfo.email || '',
                          phone: updated.personalInfo.phone || '',
                          location: updated.personalInfo.location || '',
                          bio: updated.professionalSummary,
                          summary: updated.experience[0]?.jobTitle || prev.summary,
                          skills: [
                            ...updated.skills.technical,
                            ...updated.skills.leadership,
                            ...updated.skills.business,
                            ...updated.skills.languages || [],
                            ...updated.skills.other || []
                          ].slice(0, 20)
                        }));
                        setSuccess('📝 Detailed CV information updated! Review the form above and save your profile.');
                      }}
                      saving={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-secondary">
                Make this profile active for job searches
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-secondary bg-tertiary hover:bg-gray-300 
                  dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg 
                  hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingProfile ? 'Update Profile' : 'Create Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map(profile => (
          <div key={profile.id} className="bg-primary rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Profile Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary mb-1">
                  {profile.name}
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  {profile.summary}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                profile.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`} title={profile.is_active ? 'Active' : 'Inactive'} />
            </div>

            {/* Bio */}
            <p className="text-sm text-secondary mb-4 line-clamp-3">
              {profile.bio}
            </p>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {profile.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 
                        text-purple-700 dark:text-purple-300 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 
                      text-gray-600 dark:text-gray-400 rounded-full">
                      +{profile.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-tertiary">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(profile)}
                  className="p-2 text-secondary hover:text-primary hover:bg-tertiary 
                    rounded-lg transition-colors"
                  title="Edit profile"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 
                    dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete profile"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyShareLink(profile.id)}
                  className="p-2 text-secondary hover:text-primary hover:bg-tertiary 
                    rounded-lg transition-colors"
                  title="Copy share link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <a
                  href={generateShareLink(profile.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-secondary hover:text-primary hover:bg-tertiary 
                    rounded-lg transition-colors"
                  title="View public profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {profiles.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-secondary mb-2">No profiles created yet</p>
            <p className="text-sm text-tertiary mb-6">
              Upload your CV to automatically create your first professional profile
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white 
                rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Upload className="h-4 w-4" />
              <span>Upload CV to Get Started</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}