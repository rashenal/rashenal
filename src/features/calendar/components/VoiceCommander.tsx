import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Shield,
  ShieldCheck,
  Activity,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Settings,
  User,
  Clock,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Search,
  Target,
  Zap,
  Heart,
  Home,
  Users,
  Phone,
  MessageSquare,
  Play,
  Pause,
  Square,
  RotateCcw,
  Save
} from 'lucide-react';
import { VoiceBiometric } from '../services/VoiceBiometric';
import { EventIntelligence } from '../services/EventIntelligence';

interface VoiceCommanderProps {
  isActive: boolean;
  isAuthenticated: boolean;
  onCommand: (command: string) => Promise<void>;
  onClose: () => void;
  onAuthComplete: () => void;
}

interface VoiceCommand {
  id: string;
  command: string;
  timestamp: Date;
  confidence: number;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

interface VoiceSettings {
  sensitivity: number;
  noiseReduction: boolean;
  language: string;
  voiceActivation: boolean;
  commandHistory: boolean;
  audioFeedback: boolean;
}

const EXAMPLE_COMMANDS = [
  'Schedule coffee with Sarah next week when we\'re both free',
  'Move my morning routine 30 minutes earlier for the next month', 
  'Find me 2 hours for deep work on the AI project this week',
  'Remind me to call mom when I\'m walking home',
  'Block focus time daily until this goal is complete',
  'What\'s my energy level at 3 PM today?',
  'Cancel my 2 PM meeting and reschedule for tomorrow',
  'Create a habit for daily meditation at 7 AM',
  'Show me all events tagged with \'health\'',
  'When is my next free 2-hour block?'
];

export default function VoiceCommander({
  isActive,
  isAuthenticated,
  onCommand,
  onClose,
  onAuthComplete
}: VoiceCommanderProps) {
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  
  // Authentication state
  const [authStep, setAuthStep] = useState<'idle' | 'recording' | 'verifying' | 'complete'>('idle');
  const [voicePrint, setVoicePrint] = useState<string | null>(null);
  const [authProgress, setAuthProgress] = useState(0);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    sensitivity: 75,
    noiseReduction: true,
    language: 'en-US',
    voiceActivation: true,
    commandHistory: true,
    audioFeedback: true
  });
  
  // Audio state
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Services
  const [voiceBiometric, setVoiceBiometric] = useState<VoiceBiometric | null>(null);
  const [intelligence, setIntelligence] = useState<EventIntelligence | null>(null);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioAnalyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize services and speech recognition
  useEffect(() => {
    initializeServices();
    initializeSpeechRecognition();
    
    return () => {
      cleanup();
    };
  }, []);

  // Handle voice activation
  useEffect(() => {
    if (isActive && isAuthenticated) {
      startListening();
    } else {
      stopListening();
    }
  }, [isActive, isAuthenticated]);

  const initializeServices = async () => {
    try {
      const voiceService = new VoiceBiometric();
      await voiceService.initialize('user-id'); // TODO: Get actual user ID
      setVoiceBiometric(voiceService);

      const intelligenceService = new EventIntelligence();
      await intelligenceService.initialize('user-id');
      setIntelligence(intelligenceService);
    } catch (error) {
      console.error('Failed to initialize voice services:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.language;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript, event.results[event.resultIndex][0].confidence);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isActive && isAuthenticated && settings.voiceActivation) {
          // Restart recognition if voice activation is enabled
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              recognitionRef.current.start();
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported');
      alert('Voice commands are not supported in this browser. Please use Chrome or Edge.');
    }
  };

  const initializeAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const microphone = audioCtx.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      setAudioContext(audioCtx);
      audioAnalyzerRef.current = analyser;
      
      startAudioLevelMonitoring();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!audioAnalyzerRef.current) return;

    const analyser = audioAnalyzerRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      await initializeAudioContext();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };

  const processVoiceCommand = async (transcript: string, confidence: number) => {
    if (!transcript.trim() || confidence < 0.7) return;

    const commandId = `cmd-${Date.now()}`;
    const command: VoiceCommand = {
      id: commandId,
      command: transcript,
      timestamp: new Date(),
      confidence,
      status: 'processing'
    };

    setCommandHistory(prev => [command, ...prev.slice(0, 9)]);
    setIsProcessing(true);
    setCurrentTranscript('');

    try {
      // Clear any existing timeout
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }

      // Set processing timeout
      commandTimeoutRef.current = setTimeout(() => {
        setCommandHistory(prev => prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, status: 'error', error: 'Command timeout' }
            : cmd
        ));
        setIsProcessing(false);
      }, 10000);

      // Process the command
      await onCommand(transcript);

      // Mark as completed
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === commandId 
          ? { ...cmd, status: 'completed', result: 'Command executed successfully' }
          : cmd
      ));

      // Play success feedback
      if (settings.audioFeedback) {
        playAudioFeedback('success');
      }

    } catch (error) {
      console.error('Command processing failed:', error);
      
      setCommandHistory(prev => prev.map(cmd => 
        cmd.id === commandId 
          ? { ...cmd, status: 'error', error: error.message }
          : cmd
      ));

      if (settings.audioFeedback) {
        playAudioFeedback('error');
      }
    } finally {
      setIsProcessing(false);
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    }
  };

  const startVoiceAuthentication = async () => {
    if (!voiceBiometric) return;

    setAuthStep('recording');
    setAuthProgress(0);

    try {
      // Simulate voice authentication process
      const phrases = [
        'My voice is my password, verify me',
        'I am the owner of this calendar',
        'Authenticate my voice biometric signature'
      ];

      for (let i = 0; i < phrases.length; i++) {
        setAuthProgress((i / phrases.length) * 100);
        
        // In a real implementation, this would record and analyze voice
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setAuthStep('verifying');
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAuthStep('complete');
      setAuthProgress(100);
      
      setTimeout(() => {
        onAuthComplete();
        setAuthStep('idle');
      }, 1000);

    } catch (error) {
      console.error('Voice authentication failed:', error);
      setAuthStep('idle');
      alert('Voice authentication failed. Please try again.');
    }
  };

  const playAudioFeedback = (type: 'success' | 'error' | 'start' | 'stop') => {
    if (!settings.audioFeedback || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'success':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
        break;
      case 'start':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        break;
      case 'stop':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        break;
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const cleanup = () => {
    stopListening();
    
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    
    if (audioContext) {
      audioContext.close();
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Mic className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Voice Commander</h2>
                <p className="text-indigo-100">
                  {!isAuthenticated ? 'Voice authentication required' : 
                   isListening ? 'Listening for commands...' : 'Voice recognition ready'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Audio Level Indicator */}
              {isListening && (
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-8 rounded-full transition-all ${
                          audioLevel > (i * 50) ? 'bg-green-400' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Flow */}
        {!isAuthenticated && (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <Shield className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Voice Biometric Authentication
              </h3>
              
              <p className="text-gray-600 mb-8">
                For security, we need to verify your voice before enabling voice commands.
                This creates a unique voice signature that only you can use.
              </p>

              {authStep === 'idle' && (
                <button
                  onClick={startVoiceAuthentication}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <ShieldCheck className="h-5 w-5 inline mr-2" />
                  Start Voice Authentication
                </button>
              )}

              {authStep === 'recording' && (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Mic className="h-12 w-12 text-red-600" />
                    </div>
                    <div className="absolute inset-0 border-4 border-red-300 rounded-full animate-ping"></div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 mb-2">
                      Please speak the following phrase clearly:
                    </p>
                    <p className="text-lg text-indigo-600 font-semibold">
                      "My voice is my password, verify me"
                    </p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${authProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {authStep === 'verifying' && (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    Analyzing voice biometric signature...
                  </p>
                </div>
              )}

              {authStep === 'complete' && (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-green-600">
                    Voice authentication successful!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Voice Interface */}
        {isAuthenticated && (
          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                <div className="flex items-center space-x-2">
                  {isListening ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Listening</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium">Standby</span>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <Activity className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Processing</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Transcript */}
              {currentTranscript && (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">You said:</p>
                      <p className="text-gray-900 font-medium">{currentTranscript}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Command History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Commands</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commandHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No commands yet. Try saying something!</p>
                  </div>
                ) : (
                  commandHistory.map((cmd) => (
                    <div key={cmd.id} className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{cmd.command}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {cmd.timestamp.toLocaleTimeString()} • {Math.round(cmd.confidence * 100)}% confidence
                          </p>
                        </div>
                        
                        <div className="ml-4">
                          {cmd.status === 'processing' && (
                            <div className="flex items-center space-x-1 text-indigo-600">
                              <Activity className="h-4 w-4 animate-spin" />
                              <span className="text-xs">Processing</span>
                            </div>
                          )}
                          {cmd.status === 'completed' && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Done</span>
                            </div>
                          )}
                          {cmd.status === 'error' && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Error</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {cmd.result && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                          {cmd.result}
                        </div>
                      )}
                      
                      {cmd.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                          {cmd.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Example Commands */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Example Commands</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_COMMANDS.slice(0, 6).map((example, index) => (
                  <div 
                    key={index}
                    className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => {
                      if (isListening) {
                        processVoiceCommand(example, 1.0);
                      }
                    }}
                  >
                    <p className="text-sm text-indigo-800 font-medium">"{example}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voice Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Voice Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sensitivity ({settings.sensitivity}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      sensitivity: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.noiseReduction}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        noiseReduction: e.target.checked 
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Noise Reduction</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.voiceActivation}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        voiceActivation: e.target.checked 
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Voice Activation</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.audioFeedback}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        audioFeedback: e.target.checked 
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Audio Feedback</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      language: e.target.value 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}