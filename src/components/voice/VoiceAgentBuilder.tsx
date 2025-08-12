import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, Upload, Download, Settings, 
         TestTube, Share, Eye, EyeOff, CheckCircle, AlertCircle, 
         Info, Trash2, Copy } from 'lucide-react';
import VoiceService, { VoiceAgentConfig } from '../../services/voice/VoiceService';
import VoiceAgentParser from '../../services/voice/VoiceAgentParser';
import { useAuth } from '../../contexts/userContext';

interface VoiceAgentBuilderProps {
  onAgentCreated?: (config: VoiceAgentConfig) => void;
  initialConfig?: VoiceAgentConfig;
  mode?: 'create' | 'edit';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function VoiceAgentBuilder({ 
  onAgentCreated, 
  initialConfig, 
  mode = 'create' 
}: VoiceAgentBuilderProps) {
  const { user } = useAuth();
  const [agentName, setAgentName] = useState(initialConfig?.name || '');
  const [markdownConfig, setMarkdownConfig] = useState(
    initialConfig ? '' : VoiceAgentParser.generateTemplate()
  );
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [voiceService, setVoiceService] = useState<VoiceService | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);

  // Real-time validation
  const validateConfig = useCallback(() => {
    if (!markdownConfig.trim()) {
      setValidation({ isValid: false, errors: ['Configuration cannot be empty'], warnings: [] });
      return;
    }
    
    const result = VoiceAgentParser.validateConfig(markdownConfig);
    setValidation(result);
  }, [markdownConfig]);

  React.useEffect(() => {
    validateConfig();
  }, [validateConfig]);

  const handleVoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File too large. Please upload a file smaller than 10MB');
        return;
      }
      
      setVoiceFile(file);
    }
  };

  const handleTestVoice = async () => {
    if (!validation.isValid) {
      alert('Please fix configuration errors before testing');
      return;
    }

    try {
      setIsTesting(true);
      
      const config = VoiceAgentParser.parseMarkdown(markdownConfig);
      const service = new VoiceService(config, user?.id || 'test-user');
      setVoiceService(service);
      
      // Test voice synthesis
      await service.testVoice('Hello! This is a test of your voice agent configuration.');
      
      // Start listening for voice commands
      if (service.getStatus().isSupported) {
        await service.startListening();
        setIsListening(true);
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      alert('Voice test failed. Please check your configuration.');
    } finally {
      setIsTesting(false);
    }
  };

  const stopTesting = () => {
    if (voiceService) {
      voiceService.stopListening();
      setIsListening(false);
    }
  };

  const handleDeploy = async () => {
    if (!validation.isValid) {
      alert('Please fix all errors before deploying');
      return;
    }

    try {
      setDeploymentStatus('deploying');
      
      const config = VoiceAgentParser.parseMarkdown(markdownConfig);
      config.name = agentName || config.name;
      
      // In a real implementation, this would save to Supabase
      console.log('Deploying agent config:', config);
      
      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeploymentStatus('deployed');
      
      if (onAgentCreated) {
        onAgentCreated(config);
      }
      
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus('error');
    }
  };

  const handleExport = () => {
    const config = VoiceAgentParser.parseMarkdown(markdownConfig);
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName || 'voice-agent'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (templateName: string) => {
    let template = '';
    
    switch (templateName) {
      case 'motivational-coach':
        template = VoiceAgentParser.generateTemplate('Motivational Coach');
        template = template.replace('encouraging', 'encouraging')
                         .replace('moderate', 'high')
                         .replace('- Encouraging and supportive', '- High-energy and motivational\n- Uses positive affirmations\n- Celebrates small wins');
        break;
        
      case 'productivity-assistant':
        template = VoiceAgentParser.generateTemplate('Productivity Assistant');
        template = template.replace('encouraging', 'direct')
                         .replace('moderate', 'moderate')
                         .replace('- Encouraging and supportive', '- Direct and efficient\n- Task-focused\n- Time-conscious');
        break;
        
      case 'mindful-guide':
        template = VoiceAgentParser.generateTemplate('Mindful Guide');
        template = template.replace('encouraging', 'socratic')
                         .replace('medium', 'slow')
                         .replace('- Encouraging and supportive', '- Calm and reflective\n- Asks thoughtful questions\n- Promotes self-awareness');
        break;
        
      default:
        template = VoiceAgentParser.generateTemplate();
    }
    
    setMarkdownConfig(template);
  };

  const insertAtCursor = (text: string) => {
    const textarea = markdownRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = markdownConfig;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    setMarkdownConfig(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎤 {mode === 'create' ? 'Create' : 'Edit'} Voice Agent
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Build your AI voice coach with zero code required
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Validation Status */}
            <div className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                validation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validation.isValid ? 'Valid Configuration' : `${validation.errors.length} Error(s)`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Agent Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="My Personal Coach"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Template Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🎨 Quick Start Templates
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleImportTemplate('motivational-coach')}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  💪 Motivational Coach
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  High-energy, celebrates wins
                </div>
              </button>
              
              <button
                onClick={() => handleImportTemplate('productivity-assistant')}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  🎯 Productivity Assistant
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Direct, task-focused
                </div>
              </button>
              
              <button
                onClick={() => handleImportTemplate('mindful-guide')}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  🧘 Mindful Guide
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Calm, reflective, thoughtful
                </div>
              </button>
              
              <button
                onClick={() => setMarkdownConfig(VoiceAgentParser.generateTemplate())}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  📝 Blank Template
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Start from scratch
                </div>
              </button>
            </div>
          </div>

          {/* Voice Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🎙️ Custom Voice (Optional)
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 
                          rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleVoiceUpload}
                className="hidden"
              />
              
              {voiceFile ? (
                <div className="space-y-3">
                  <div className="text-green-600 dark:text-green-400">
                    ✅ {voiceFile.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(voiceFile.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                  <button
                    onClick={() => setVoiceFile(null)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload voice sample
                    </button>
                    <div className="text-sm text-gray-500 mt-1">
                      30 seconds of clear speech (MP3, WAV, M4A)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Quick Actions
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => insertAtCursor('\n- new wake word\n')}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 
                         rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              >
                <Mic className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">Add Wake Word</div>
              </button>
              
              <button
                onClick={() => insertAtCursor('\n- trigger → response\n')}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 
                         rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                <Settings className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">Add Pattern</div>
              </button>
              
              <button
                onClick={() => insertAtCursor('\n- personality trait\n')}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 
                         rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                <Copy className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">Add Trait</div>
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                         rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mx-auto mb-1" /> : <Eye className="w-4 h-4 mx-auto mb-1" />}
                <div className="text-xs">{showPreview ? 'Hide' : 'Preview'}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Editor */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📝 Configuration
              </h2>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Export Configuration"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <textarea
                ref={markdownRef}
                value={markdownConfig}
                onChange={(e) => setMarkdownConfig(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your agent configuration here..."
              />
              
              {/* Validation Messages */}
              {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                <div className="space-y-2">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))}
                  
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                      <Info className="w-4 h-4" />
                      <span className="text-sm">{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test & Deploy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🧪 Test & Deploy
            </h2>
            
            <div className="space-y-4">
              {/* Test Voice */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={isListening ? stopTesting : handleTestVoice}
                  disabled={isTesting || !validation.isValid}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg 
                    font-medium transition-colors ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : isTesting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : validation.isValid
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isTesting ? (
                    <>
                      <TestTube className="w-4 h-4 animate-pulse" />
                      <span>Testing...</span>
                    </>
                  ) : isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Test Voice</span>
                    </>
                  )}
                </button>
              </div>
              
              {isListening && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 
                              rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>Listening for voice commands... Try saying a wake word!</span>
                  </div>
                </div>
              )}
              
              {/* Deploy Button */}
              <button
                onClick={handleDeploy}
                disabled={!validation.isValid || deploymentStatus === 'deploying'}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg 
                  font-medium transition-colors ${
                  deploymentStatus === 'deployed'
                    ? 'bg-green-600 text-white'
                    : deploymentStatus === 'deploying'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : validation.isValid
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {deploymentStatus === 'deploying' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : deploymentStatus === 'deployed' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Deployed Successfully!</span>
                  </>
                ) : (
                  <>
                    <Share className="w-4 h-4" />
                    <span>Deploy Agent</span>
                  </>
                )}
              </button>
              
              {deploymentStatus === 'deployed' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 
                              rounded-lg p-4">
                  <div className="text-green-800 dark:text-green-200 text-sm">
                    <strong>🎉 Agent deployed successfully!</strong>
                    <div className="mt-2 space-y-1">
                      <div>• WhatsApp: Available on your connected number</div>
                      <div>• Web Interface: Ready in your dashboard</div>
                      <div>• Apple Watch: Coming soon</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Panel */}
      {showPreview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            👁️ Configuration Preview
          </h2>
          
          {validation.isValid ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(VoiceAgentParser.parseMarkdown(markdownConfig), null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400 text-center py-8">
              Fix configuration errors to see preview
            </div>
          )}
        </div>
      )}
    </div>
  );
}
