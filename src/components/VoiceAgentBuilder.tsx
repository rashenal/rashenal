/**
 * Zero-Code Voice Agent Builder
 * Drag-and-drop interface for creating voice agents
 */

import React, { useState, useRef } from 'react';
import { VoiceAgentConfig, VoiceAgentParser, generateVoiceAgentTemplate } from '../services/voice/VoiceAgentParser';
import { VoiceService, createDefaultVoiceConfig } from '../services/voice/VoiceService';
import { Upload, Play, Pause, Download, Save, MessageCircle, Watch, Smartphone } from 'lucide-react';

interface VoiceAgentBuilderProps {
  onSave?: (config: VoiceAgentConfig) => void;
  onDeploy?: (config: VoiceAgentConfig, platforms: string[]) => void;
}

export const VoiceAgentBuilder: React.FC<VoiceAgentBuilderProps> = ({
  onSave,
  onDeploy
}) => {
  const [config, setConfig] = useState<Partial<VoiceAgentConfig>>();
  const [markdownContent, setMarkdownContent] = useState(generateVoiceAgentTemplate());
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['web']);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  
  const voiceService = useRef<VoiceService | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse markdown and update config
  const handleMarkdownChange = (content: string) => {
    setMarkdownContent(content);
    try {
      const parsedConfig = VoiceAgentParser.parseMarkdown(content);
      setConfig(parsedConfig);
    } catch (error) {
      console.error('Error parsing markdown:', error);
    }
  };

  // Handle voice file upload
  const handleVoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setVoiceFile(file);
      
      // Update config with voice file
      const updatedMarkdown = markdownContent.replace(
        '- **Voice Sample:** (upload your voice file here)',
        `- **Voice Sample:** ${file.name}`
      );
      handleMarkdownChange(updatedMarkdown);
    }
  };

  // Test voice agent
  const handleTestVoice = async () => {
    if (!config) return;

    try {
      if (!voiceService.current) {
        const voiceConfig = createDefaultVoiceConfig(config);
        voiceService.current = new VoiceService(voiceConfig);
      }

      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        await voiceService.current.speak(config.conversationFlow?.greeting || 'Hello!');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsPlaying(false);
    }
  };

  // Save configuration
  const handleSave = () => {
    if (config && onSave) {
      onSave(config as VoiceAgentConfig);
    }
  };

  // Deploy to selected platforms
  const handleDeploy = () => {
    if (config && onDeploy) {
      onDeploy(config as VoiceAgentConfig, selectedPlatforms);
    }
  };

  // Download configuration as markdown file
  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config?.name?.replace(/\s+/g, '-').toLowerCase() || 'voice-agent'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Voice Agent Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create your AI voice companion with zero code
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {previewMode === 'edit' ? 'Preview' : 'Edit'}
          </button>
          
          <button
            onClick={handleTestVoice}
            disabled={!config}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            Test Voice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Agent Configuration
            </h2>

            {previewMode === 'edit' ? (
              <div className="space-y-4">
                {/* Voice Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice Sample (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleVoiceUpload}
                      accept="audio/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload size={16} />
                      Upload Voice
                    </button>
                    {voiceFile && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {voiceFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Markdown Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agent Behavior (Markdown)
                  </label>
                  <textarea
                    value={markdownContent}
                    onChange={(e) => handleMarkdownChange(e.target.value)}
                    className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Define your voice agent behavior using markdown..."
                  />
                </div>
              </div>
            ) : (
              /* Preview Panel */
              <div className="space-y-4">
                {config && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {config.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Style:</span> {config.voiceProfile?.style}
                      </div>
                      <div>
                        <span className="font-medium">Pace:</span> {config.voiceProfile?.pace}
                      </div>
                      <div>
                        <span className="font-medium">Energy:</span> {config.voiceProfile?.energy}
                      </div>
                      <div>
                        <span className="font-medium">Wake Words:</span> {config.wakeWords?.length}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Sample Greeting
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{config.conversationFlow?.greeting}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            
            <button
              onClick={handleSave}
              disabled={!config}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>

        {/* Deployment Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Deploy Your Agent
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Platforms
                </label>
                
                <div className="space-y-3">
                  {[
                    { id: 'web', label: 'Web Interface', icon: MessageCircle, description: 'Deploy to Rashenal web app' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Universal voice messaging' },
                    { id: 'watch', label: 'Apple Watch', icon: Watch, description: 'Wrist-based voice control' }
                  ].map((platform) => (
                    <label
                      key={platform.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.id]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex items-center gap-2">
                        <platform.icon size={16} className="text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {platform.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {platform.description}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={!config || selectedPlatforms.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all font-medium"
              >
                Deploy Voice Agent
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Quick Templates
            </h3>
            
            <div className="space-y-2">
              {[
                { name: 'Personal Coach', description: 'Encouraging daily motivation' },
                { name: 'Productivity Assistant', description: 'Task-focused and direct' },
                { name: 'Mindfulness Guide', description: 'Calm and centered approach' },
                { name: 'Fitness Buddy', description: 'Energetic workout companion' }
              ].map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleMarkdownChange(generateVoiceAgentTemplate(template.name))}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentBuilder;
