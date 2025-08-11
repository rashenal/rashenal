/**
 * Voice Integration Demo Component
 * Shows off the voice capabilities and provides testing interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  MessageCircle, 
  Smartphone, 
  Watch,
  Sparkles,
  Settings
} from 'lucide-react';
import { VoiceService, createDefaultVoiceConfig } from '../services/voice/VoiceService';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  platform: 'web' | 'whatsapp' | 'watch';
}

export const VoiceIntegrationDemo: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'web' | 'whatsapp' | 'watch'>('web');
  const [voiceConfig, setVoiceConfig] = useState(createDefaultVoiceConfig());
  const [isConnected, setIsConnected] = useState(false);

  const voiceService = useRef<VoiceService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize voice service
  useEffect(() => {
    try {
      voiceService.current = new VoiceService(voiceConfig);
      setIsConnected(true);
      
      // Add welcome message
      addMessage({
        type: 'assistant',
        content: 'Hello! I\'m your Rashenal voice assistant. Try saying "Hey Claude" to start a conversation!',
        platform: selectedPlatform
      });
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      setIsConnected(false);
    }
  }, [voiceConfig]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => {
    const newMessage: VoiceMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startListening = () => {
    if (!voiceService.current) return;

    try {
      setIsListening(true);
      voiceService.current.startListening((transcript) => {
        setCurrentTranscript(transcript);
        
        // If transcript is final, process it
        if (transcript.trim()) {
          handleUserMessage(transcript);
          setCurrentTranscript('');
        }
      });
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (voiceService.current) {
      voiceService.current.stopListening();
    }
    setIsListening(false);
    setCurrentTranscript('');
  };

  const handleUserMessage = async (message: string) => {
    // Add user message
    addMessage({
      type: 'user',
      content: message,
      platform: selectedPlatform
    });

    // Generate AI response
    try {
      const response = await generateResponse(message);
      
      // Add assistant response
      addMessage({
        type: 'assistant',
        content: response,
        platform: selectedPlatform
      });

      // Speak the response
      await speakResponse(response);
      
    } catch (error) {
      console.error('Error generating response:', error);
      addMessage({
        type: 'assistant',
        content: 'I\'m sorry, I\'m having trouble processing that right now. Please try again.',
        platform: selectedPlatform
      });
    }
  };

  const generateResponse = async (message: string): Promise<string> => {
    // Simulate different responses based on platform
    const responses = {
      web: {
        'hey claude': 'Hello! I\'m your personal AI coach. How can I help you achieve your goals today?',
        'how are you': 'I\'m doing great and ready to help you! How are you feeling today?',
        'what\'s my schedule': 'I\'d love to help with your schedule! In the full version, I\'ll integrate with your calendar and tasks.',
        'help me focus': 'Absolutely! Let\'s start with a quick check-in. What\'s the most important thing you want to accomplish right now?'
      },
      whatsapp: {
        'hey claude': 'Hi! 👋 I\'m your Rashenal coach. How can I help?',
        'how are you': 'Great! 😊 How are you doing today?',
        'what\'s my schedule': 'I\'ll check your schedule! 📅 (Full integration coming soon)',
        'help me focus': 'Let\'s focus! 🎯 What\'s your top priority right now?'
      },
      watch: {
        'hey claude': 'Hi! Ready to coach?',
        'how are you': 'Good! How are you?',
        'what\'s my schedule': 'Checking schedule...',
        'help me focus': 'Focus time! Main goal?'
      }
    };

    const platformResponses = responses[selectedPlatform];
    const lowerMessage = message.toLowerCase();
    
    // Find matching response
    for (const [key, response] of Object.entries(platformResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    // Default response
    const defaults = {
      web: 'That\'s interesting! I\'m still learning, but I\'m here to help you with your personal growth journey.',
      whatsapp: 'Thanks for sharing! 💪 I\'m here to support your goals.',
      watch: 'Got it! How can I help?'
    };

    return defaults[selectedPlatform];
  };

  const speakResponse = async (text: string) => {
    if (!voiceService.current) return;

    try {
      setIsSpeaking(true);
      await voiceService.current.speak(text);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to speak response:', error);
      setIsSpeaking(false);
    }
  };

  const testPlatformMessage = () => {
    const testMessages = {
      web: 'Hey Claude, how are you doing today?',
      whatsapp: 'Hey Claude!',
      watch: 'Focus time'
    };

    handleUserMessage(testMessages[selectedPlatform]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="text-purple-500" />
          Voice Integration Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Experience the future of AI-powered personal coaching
        </p>
        
        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {isConnected ? 'Voice System Ready' : 'Voice System Offline'}
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'web', label: 'Web App', icon: MessageCircle },
            { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
            { id: 'watch', label: 'Watch', icon: Watch }
          ].map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                selectedPlatform === platform.id
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <platform.icon size={16} />
              {platform.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Voice Controls
            </h2>
            
            <div className="space-y-4">
              {/* Main Voice Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!isConnected}
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-lg font-medium transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>

              {/* Current Transcript */}
              {currentTranscript && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Listening: "{currentTranscript}"
                  </p>
                </div>
              )}

              {/* Test Button */}
              <button
                onClick={testPlatformMessage}
                className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Play size={16} />
                Test {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
              </button>

              {/* Voice Status */}
              {isSpeaking && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Volume2 size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Speaking response...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Voice Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-md font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={16} />
              Voice Settings
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Style</label>
                <select 
                  value={voiceConfig.voiceProfile?.style || 'encouraging'}
                  onChange={(e) => setVoiceConfig(prev => ({
                    ...prev,
                    voiceProfile: {
                      ...prev.voiceProfile!,
                      style: e.target.value as any
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="encouraging">Encouraging</option>
                  <option value="direct">Direct</option>
                  <option value="analytical">Analytical</option>
                  <option value="socratic">Socratic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Pace</label>
                <select 
                  value={voiceConfig.voiceProfile?.pace || 'medium'}
                  onChange={(e) => setVoiceConfig(prev => ({
                    ...prev,
                    voiceProfile: {
                      ...prev.voiceProfile!,
                      pace: e.target.value as any
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-96 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversation ({selectedPlatform})
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages
                .filter(msg => msg.platform === selectedPlatform)
                .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Wake Word Detection',
            description: 'Say "Hey Claude" to start conversations naturally',
            icon: Mic,
            status: 'Ready'
          },
          {
            title: 'WhatsApp Integration',
            description: 'Voice messaging works on any phone globally',
            icon: Smartphone,
            status: 'Active'
          },
          {
            title: 'Custom Voices',
            description: 'Upload your voice sample for personalization',
            icon: Volume2,
            status: 'Coming Soon'
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <feature.icon size={20} className="text-blue-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                {feature.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {feature.description}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full ${
              feature.status === 'Ready' || feature.status === 'Active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {feature.status}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Start Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Quick Start Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Try These Commands:</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• "Hey Claude, how are you?"</li>
              <li>• "What's my schedule like?"</li>
              <li>• "Help me focus today"</li>
              <li>• "How are my habits going?"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Platform Differences:</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Web: Detailed responses</li>
              <li>• WhatsApp: Emoji-friendly, concise</li>
              <li>• Watch: Ultra-brief, action-focused</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceIntegrationDemo;
