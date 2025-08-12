import React, { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Star, 
  Image as ImageIcon,
  Video,
  Mic,
  Shield,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  User,
  Bot
} from 'lucide-react';
import { UserProfile, MediaAssets } from '../../types/UserProfile';

interface MediaAssetsStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];

export default function MediaAssetsStep({ profile, updateProfile, onNext, onPrev }: MediaAssetsStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const mediaAssets = profile.media_assets || {} as MediaAssets;
  const profileImages = mediaAssets.profile_images || [];
  const avatarAssets = mediaAssets.avatar_assets;

  const handleInputChange = (field: string, value: any) => {
    const updatedAssets = { ...mediaAssets, [field]: value };
    updateProfile('media_assets', updatedAssets);
  };

  const validateFile = (file: File, acceptedTypes: string[]): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const simulateFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10 + Math.random() * 20;
        setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }));
        
        if (progress >= 100) {
          clearInterval(interval);
          // Create a fake URL (in real app, this would come from your storage service)
          const fakeUrl = URL.createObjectURL(file);
          resolve(fakeUrl);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }, 200);
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setErrors([]);
    
    const newErrors: string[] = [];
    const newImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file, ACCEPTED_IMAGE_TYPES);
      
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
        continue;
      }
      
      try {
        const url = await simulateFileUpload(file);
        newImages.push({
          id: `img_${Date.now()}_${i}`,
          url,
          is_primary: profileImages.length === 0 && i === 0, // First image is primary
          upload_date: new Date().toISOString(),
          alt_text: `Profile photo ${profileImages.length + i + 1}`
        });
      } catch (uploadError) {
        newErrors.push(`${file.name}: Failed to upload`);
      }
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
    
    if (newImages.length > 0) {
      handleInputChange('profile_images', [...profileImages, ...newImages]);
    }
    
    setIsUploading(false);
  };

  const handleAvatarUpload = async (files: FileList | null, type: 'photos_for_avatar' | 'audio_samples' | 'video_samples') => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setErrors([]);
    
    const acceptedTypes = type === 'photos_for_avatar' ? ACCEPTED_IMAGE_TYPES 
                        : type === 'audio_samples' ? ACCEPTED_AUDIO_TYPES 
                        : ACCEPTED_VIDEO_TYPES;
    
    const newErrors: string[] = [];
    const newAssets = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file, acceptedTypes);
      
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
        continue;
      }
      
      try {
        const url = await simulateFileUpload(file);
        
        if (type === 'photos_for_avatar') {
          newAssets.push({
            id: `avatar_${Date.now()}_${i}`,
            url,
            upload_date: new Date().toISOString(),
            usage_rights: 'ai_training' as const
          });
        } else if (type === 'audio_samples') {
          newAssets.push({
            id: `audio_${Date.now()}_${i}`,
            url,
            duration: 0, // Would be calculated from actual file
            sample_type: 'conversation' as const,
            upload_date: new Date().toISOString(),
            transcription: undefined
          });
        } else {
          newAssets.push({
            id: `video_${Date.now()}_${i}`,
            url,
            duration: 0, // Would be calculated from actual file
            sample_type: 'introduction' as const,
            upload_date: new Date().toISOString(),
            thumbnail_url: url // In real app, would generate thumbnail
          });
        }
      } catch (uploadError) {
        newErrors.push(`${file.name}: Failed to upload`);
      }
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
    }
    
    if (newAssets.length > 0) {
      const currentAvatarAssets = avatarAssets || {};
      const currentAssets = currentAvatarAssets[type] || [];
      
      handleInputChange('avatar_assets', {
        ...currentAvatarAssets,
        [type]: [...currentAssets, ...newAssets]
      });
    }
    
    setIsUploading(false);
  };

  const removeImage = (imageId: string) => {
    const updatedImages = profileImages.filter(img => img.id !== imageId);
    handleInputChange('profile_images', updatedImages);
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = profileImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    handleInputChange('profile_images', updatedImages);
  };

  const removeAvatarAsset = (assetId: string, type: 'photos_for_avatar' | 'audio_samples' | 'video_samples') => {
    if (!avatarAssets) return;
    
    const currentAssets = avatarAssets[type] || [];
    const updatedAssets = currentAssets.filter((asset: any) => asset.id !== assetId);
    
    handleInputChange('avatar_assets', {
      ...avatarAssets,
      [type]: updatedAssets
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Profile Images Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Profile Images</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Upload one or more profile photos. The first image will be your primary profile picture.
        </p>
        
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Click to upload profile images</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (multiple files allowed)</p>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
        
        {/* Profile Images Grid */}
        {profileImages.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {profileImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt_text}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </span>
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    {!image.is_primary && (
                      <button
                        onClick={() => setPrimaryImage(image.id)}
                        className="p-1 bg-black/50 text-white rounded hover:bg-black/70"
                        title="Set as primary"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-1 bg-black/50 text-white rounded hover:bg-black/70"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                  <p className="text-xs truncate">{image.alt_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Avatar Assets Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Bot className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Avatar & Voice Training (Optional)</h3>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-900">AI Avatar & Voice Training</h4>
              <p className="text-sm text-purple-700 mt-1">
                Upload photos, audio, and video samples to train AI models that can create personalized avatars 
                and voice synthesis. This enables features like AI-generated video messages and voice responses. 
                All data is used solely for your personal AI features and is never shared.
              </p>
            </div>
          </div>
        </div>

        {/* Photos for Avatar */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Photos for Avatar Training</h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload 5-10 clear photos of yourself from different angles to train a personalized avatar.
          </p>
          
          <div 
            onClick={() => document.getElementById('avatar-photos')?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload avatar training photos</p>
          </div>
          
          <input
            id="avatar-photos"
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={(e) => handleAvatarUpload(e.target.files, 'photos_for_avatar')}
            className="hidden"
          />
          
          {avatarAssets?.photos_for_avatar && avatarAssets.photos_for_avatar.length > 0 && (
            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
              {avatarAssets.photos_for_avatar.map((photo: any) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Avatar training"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeAvatarAsset(photo.id, 'photos_for_avatar')}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio Samples */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Voice Samples</h4>
          <p className="text-sm text-gray-600 mb-3">
            Record or upload 2-3 short audio clips (30 seconds - 2 minutes each) for voice synthesis training.
          </p>
          
          <div 
            onClick={() => document.getElementById('audio-samples')?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <Mic className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload voice samples</p>
          </div>
          
          <input
            id="audio-samples"
            type="file"
            multiple
            accept={ACCEPTED_AUDIO_TYPES.join(',')}
            onChange={(e) => handleAvatarUpload(e.target.files, 'audio_samples')}
            className="hidden"
          />
          
          {avatarAssets?.audio_samples && avatarAssets.audio_samples.length > 0 && (
            <div className="mt-4 space-y-2">
              {avatarAssets.audio_samples.map((audio: any) => (
                <div key={audio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Audio Sample {audio.id}</span>
                  </div>
                  <button
                    onClick={() => removeAvatarAsset(audio.id, 'audio_samples')}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Samples */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Video Samples</h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload 1-2 short video clips (30 seconds - 1 minute each) showing natural speaking patterns.
          </p>
          
          <div 
            onClick={() => document.getElementById('video-samples')?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload video samples</p>
          </div>
          
          <input
            id="video-samples"
            type="file"
            multiple
            accept={ACCEPTED_VIDEO_TYPES.join(',')}
            onChange={(e) => handleAvatarUpload(e.target.files, 'video_samples')}
            className="hidden"
          />
          
          {avatarAssets?.video_samples && avatarAssets.video_samples.length > 0 && (
            <div className="mt-4 space-y-2">
              {avatarAssets.video_samples.map((video: any) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Video className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Video Sample {video.id}</span>
                  </div>
                  <button
                    onClick={() => removeAvatarAsset(video.id, 'video_samples')}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-blue-700">Uploading...</span>
                <span className="text-sm text-blue-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Upload Errors</h4>
              <ul className="text-sm text-red-700 mt-1 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Usage Rights */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">Privacy & Usage Rights</h4>
            <p className="text-sm text-gray-600 mt-1">
              All uploaded media is encrypted and used exclusively for your personal AI features. 
              We never share your photos, audio, or video with third parties. You can delete any 
              uploaded content at any time. AI training data remains on secure servers and is not 
              used for any other purposes.
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
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
}