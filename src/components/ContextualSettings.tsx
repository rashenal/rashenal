import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Send, 
  Settings, 
  Bot, 
  Zap,
  X,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ContextualSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  currentComponent?: string;
}

interface ContextualHelp {
  title: string;
  description: string;
  quickActions: QuickAction[];
  voiceCommands: string[];
  tips: string[];
}

interface QuickAction {
  label: string;
  command: string;
  description: string;
}

export default function ContextualSettings({ 
  isOpen, 
  onClose, 
  currentPage, 
  currentComponent 
}: ContextualSettingsProps) {
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Get contextual help based on current page
  const getContextualHelp = (): ContextualHelp => {
    const path = location.pathname;
    
    switch (true) {
      case path.includes('/tasks'):
        return {
          title: 'Smart Tasks Help',
          description: 'Manage your tasks with AI-powered assistance',
          quickActions: [
            { label: 'Create Task', command: 'create new task', description: 'Add a new task to your board' },
            { label: 'Filter Tasks', command: 'show only high priority', description: 'Filter tasks by priority' },
            { label: 'Open Settings', command: 'open task settings', description: 'Configure board settings' },
            { label: 'Switch View', command: 'switch to list view', description: 'Change board layout' }
          ],
          voiceCommands: [
            '"Create a task called [task name]"',
            '"Move task to in progress"',
            '"Show settings"',
            '"Switch to kanban view"',
            '"Filter by high priority"'
          ],
          tips: [
            'Drag and drop tasks between columns',
            'Double-click a task to edit details',
            'Use keyboard shortcuts: N for new task, S for settings'
          ]
        };

      case path.includes('/habits'):
        return {
          title: 'Habit Tracker Help',
          description: 'Build and maintain healthy habits with AI coaching',
          quickActions: [
            { label: 'Create Habit', command: 'create new habit', description: 'Start tracking a new habit' },
            { label: 'Mark Complete', command: 'mark habit complete', description: 'Log today\'s progress' },
            { label: 'View Streak', command: 'show my streaks', description: 'Check your progress' },
            { label: 'Get Coaching', command: 'give me habit advice', description: 'Get AI coaching tips' }
          ],
          voiceCommands: [
            '"Create habit [habit name]"',
            '"Mark [habit] as done"',
            '"Show my streaks"',
            '"Give me motivation for [habit]"'
          ],
          tips: [
            'Start with small, achievable habits',
            'Focus on consistency over perfection',
            'Use the AI coach for personalized advice'
          ]
        };

      case path.includes('/jobs'):
        return {
          title: 'Job Finder Help',
          description: 'Discover and track job opportunities with AI analysis',
          quickActions: [
            { label: 'Create Profile', command: 'create job profile', description: 'Set up a new career profile' },
            { label: 'Start Search', command: 'start job search', description: 'Begin automated job discovery' },
            { label: 'Review Matches', command: 'show job matches', description: 'View recent opportunities' },
            { label: 'Configure Agent', command: 'configure email agent', description: 'Set up email processing' }
          ],
          voiceCommands: [
            '"Create profile for [role type]"',
            '"Start searching for [job title]"',
            '"Show recent matches"',
            '"Configure email settings"'
          ],
          tips: [
            'Create multiple profiles for different career paths',
            'Set realistic salary expectations',
            'Review AI match scores to understand fit'
          ]
        };

      case path.includes('/integrations'):
        return {
          title: 'Integrations Help',
          description: 'Connect and manage external services and AI agents',
          quickActions: [
            { label: 'Connect Email', command: 'connect outlook', description: 'Set up email integration' },
            { label: 'Configure Agent', command: 'configure job finder agent', description: 'Set up AI analysis' },
            { label: 'Check Status', command: 'show integration status', description: 'View connection health' },
            { label: 'Sync Data', command: 'sync all integrations', description: 'Refresh all connections' }
          ],
          voiceCommands: [
            '"Connect to [service name]"',
            '"Configure [agent type] agent"',
            '"Show integration status"',
            '"Sync all data"'
          ],
          tips: [
            'Start with email integration for best results',
            'Configure agents based on your specific needs',
            'Monitor agent performance regularly'
          ]
        };

      default:
        return {
          title: 'General Help',
          description: 'Navigate and control Rashenal with voice or chat commands',
          quickActions: [
            { label: 'Navigation', command: 'go to tasks', description: 'Navigate to different sections' },
            { label: 'Settings', command: 'open preferences', description: 'Access global settings' },
            { label: 'Help', command: 'show help', description: 'Get assistance' }
          ],
          voiceCommands: [
            '"Go to [page name]"',
            '"Open settings"',
            '"Show help"',
            '"What can I do here?"'
          ],
          tips: [
            'Use voice commands for hands-free navigation',
            'Chat interface understands natural language',
            'Each page has context-specific commands'
          ]
        };
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    setChatHistory(prev => [...prev, { role: 'user', content: `🎤 ${transcript}` }]);
    processCommand(transcript);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', content: chatInput }]);
    processCommand(chatInput);
    setChatInput('');
  };

  const processCommand = (command: string) => {
    // Simulate AI processing
    setTimeout(() => {
      const response = generateResponse(command);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Execute actual command if needed
      executeCommand(command);
    }, 1000);
  };

  const generateResponse = (command: string): string => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('create') && lowerCommand.includes('task')) {
      return 'I\'ll help you create a new task. What would you like to call it?';
    } else if (lowerCommand.includes('settings') || lowerCommand.includes('configure')) {
      return 'Opening settings panel for you now.';
    } else if (lowerCommand.includes('help')) {
      return 'I\'m here to help! You can use voice commands or type questions. Try saying \'create new task\' or \'show settings\'.';
    } else if (lowerCommand.includes('navigate') || lowerCommand.includes('go to')) {
      return 'I can help you navigate. Where would you like to go?';
    } else {
      return 'I understand you\'re looking for help with that. Let me show you the relevant options.';
    }
  };

  const executeCommand = (command: string) => {
    // Implementation for actual command execution
    console.log('Executing command:', command);
  };

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const contextualHelp = getContextualHelp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{contextualHelp.title}</h2>
              <p className="text-sm text-gray-600">{contextualHelp.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Help & Commands */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {contextualHelp.quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => processCommand(action.command)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{action.label}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                      <div className="text-xs text-purple-600 mt-1">"{action.command}"</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Commands */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Mic className="h-5 w-5 text-green-500 mr-2" />
                  Voice Commands
                </h3>
                <div className="space-y-2">
                  {contextualHelp.voiceCommands.map((command, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                      <code className="text-sm text-green-800">{command}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                  Tips & Tricks
                </h3>
                <div className="space-y-2">
                  {contextualHelp.tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="w-1/2 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  AI Assistant
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={isSpeaking ? () => speechSynthesis.cancel() : () => speak('Hello! I\'m ready to help you navigate and control this page.')}
                    className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Start a conversation or use voice commands!</p>
                  <p className="text-sm mt-2">Try saying "What can I do here?" or "Show settings"</p>
                </div>
              )}
              
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask a question or give a command..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}