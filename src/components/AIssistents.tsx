// AIssistents - AI Assistant Management System
// Create, train, and manage personalized AI assistants with document upload capability

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Plus,
  Upload,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  Edit,
  User,
  Brain,
  Cpu,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Send
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { aiService } from '../lib/AIService';

interface AIssistent {
  id: string;
  name: string;
  description: string;
  personality: string;
  expertise: string[];
  style: 'empowering' | 'direct' | 'supportive' | 'analytical' | 'creative' | 'motivational';
  access_level: 'personal' | 'shared' | 'public';
  is_active: boolean;
  training_documents: TrainingDocument[];
  chat_history_count: number;
  created_at: string;
  created_by: string;
  avatar_color: string;
}

interface TrainingDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'url' | 'manual';
  size?: number;
  uploaded_at: string;
  status: 'processing' | 'trained' | 'error';
  content_summary?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  assistant_id: string;
}

const ADMIN_EMAIL = 'rharveybis@hotmail.com';

export default function AIssistents() {
  const { user } = useUser();
  const [aissistents, setAissistents] = useState<AIssistent[]>([]);
  const [selectedAissistent, setSelectedAissistent] = useState<AIssistent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'training' | 'settings'>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    loadAissistents();
  }, [user]);

  const loadAissistents = () => {
    // Mock AIssistents for Elizabeth Harvey - demonstrating the system
    const mockAissistents: AIssistent[] = [
      {
        id: '1',
        name: 'Health Guardian',
        description: 'Your personal health and wellness coach with medical knowledge and empathy',
        personality: 'I am a caring, knowledgeable health companion who combines medical expertise with deep understanding of your personal health journey. I provide evidence-based guidance while being sensitive to your individual needs and circumstances.',
        expertise: ['Health Tracking', 'Nutrition', 'Exercise', 'Mental Wellness', 'Medical Guidance'],
        style: 'supportive',
        access_level: 'personal',
        is_active: true,
        training_documents: [
          {
            id: '1a',
            name: 'Medical Reference Guide.pdf',
            type: 'pdf',
            size: 2400000,
            uploaded_at: '2025-08-01T10:00:00Z',
            status: 'trained',
            content_summary: 'Comprehensive medical reference covering common conditions, symptoms, and treatments'
          },
          {
            id: '1b',
            name: 'Nutrition Guidelines.txt',
            type: 'txt',
            size: 45000,
            uploaded_at: '2025-08-02T14:30:00Z',
            status: 'trained',
            content_summary: 'Evidence-based nutrition guidelines and meal planning strategies'
          }
        ],
        chat_history_count: 47,
        created_at: '2025-07-15T08:00:00Z',
        created_by: user?.id || '',
        avatar_color: 'bg-green-500'
      },
      {
        id: '2', 
        name: 'Executive Mentor',
        description: 'Leadership development coach specializing in empowering neurodiverse professionals',
        personality: 'I am your strategic leadership ally, combining executive experience with deep understanding of neurodivergent strengths. I help you leverage your unique thinking patterns for exceptional leadership.',
        expertise: ['Leadership Development', 'Strategic Planning', 'Team Management', 'Neurodiversity Advocacy', 'Executive Coaching'],
        style: 'empowering',
        access_level: 'personal',
        is_active: true,
        training_documents: [
          {
            id: '2a',
            name: 'Leadership Excellence Manual.pdf',
            type: 'pdf',
            size: 1800000,
            uploaded_at: '2025-07-20T12:00:00Z',
            status: 'trained',
            content_summary: 'Advanced leadership strategies and neurodivergent strengths in executive roles'
          },
          {
            id: '2b',
            name: 'Executive Coaching Techniques.docx',
            type: 'docx',
            size: 890000,
            uploaded_at: '2025-07-22T16:45:00Z',
            status: 'trained',
            content_summary: 'Professional coaching methodologies and leadership development frameworks'
          }
        ],
        chat_history_count: 32,
        created_at: '2025-07-18T11:30:00Z',
        created_by: user?.id || '',
        avatar_color: 'bg-blue-600'
      },
      {
        id: '3',
        name: 'Habit Architect',
        description: 'Specialized in building sustainable habits and behavior change',
        personality: 'I am your gentle yet persistent habit-building companion. I understand that lasting change happens through small, consistent steps, and I celebrate every victory with you.',
        expertise: ['Habit Formation', 'Behavior Change', 'Motivation Psychology', 'Routine Design', 'Progress Tracking'],
        style: 'motivational',
        access_level: 'personal',
        is_active: true,
        training_documents: [
          {
            id: '3a',
            name: 'Habit Science Research.pdf',
            type: 'pdf',
            size: 1200000,
            uploaded_at: '2025-08-05T09:15:00Z',
            status: 'processing',
            content_summary: 'Latest research on habit formation and behavior change psychology'
          }
        ],
        chat_history_count: 18,
        created_at: '2025-08-03T14:20:00Z',
        created_by: user?.id || '',
        avatar_color: 'bg-purple-500'
      },
      {
        id: '4',
        name: 'Elizabeth\'s Empowerment Coach',
        description: 'A women-centered leadership coach honoring your mother\'s memory and empowering female leaders',
        personality: 'I am your sister in leadership - a coach who deeply understands the unique challenges and extraordinary strengths of neurodivergent women. I honor your mother Elizabeth\'s legacy by helping you build the confidence, clarity, and courage to lead authentically. I believe in your inherent wisdom, celebrate your unique perspective, and support you in creating the impact only you can make.',
        expertise: ['Women\'s Leadership', 'Neurodivergent Strengths', 'Imposter Syndrome', 'Executive Presence', 'Authentic Leadership', 'Work-Life Integration', 'Difficult Conversations', 'Team Empowerment'],
        style: 'empowering',
        access_level: 'personal',
        is_active: true,
        training_documents: [
          {
            id: '4a',
            name: 'Women in Leadership Research.pdf',
            type: 'pdf',
            size: 2100000,
            uploaded_at: '2025-08-09T14:00:00Z',
            status: 'trained',
            content_summary: 'Comprehensive research on women\'s leadership styles, neurodivergent executive strengths, and overcoming systemic barriers'
          },
          {
            id: '4b',
            name: 'Neurodivergent Leadership Guide.docx',
            type: 'docx',
            size: 1400000,
            uploaded_at: '2025-08-09T14:15:00Z',
            status: 'trained',
            content_summary: 'Guide to leveraging ADHD, autism, and other neurodivergent traits as executive superpowers'
          },
          {
            id: '4c',
            name: 'Elizabeth Harvey Memorial Values.txt',
            type: 'txt',
            size: 35000,
            uploaded_at: '2025-08-09T14:30:00Z',
            status: 'trained',
            content_summary: 'Personal values, leadership principles, and inspirational quotes from Elizabeth Harvey\'s life and legacy'
          }
        ],
        chat_history_count: 8,
        created_at: '2025-08-09T13:45:00Z',
        created_by: user?.id || '',
        avatar_color: 'bg-rose-500'
      }
    ];

    setAissistents(mockAissistents);
    if (!selectedAissistent && mockAissistents.length > 0) {
      setSelectedAissistent(mockAissistents[0]);
      loadChatHistory(mockAissistents[0].id);
    }
  };

  const loadChatHistory = (assistantId: string) => {
    const assistant = aissistents.find(a => a.id === assistantId);
    if (!assistant) return;

    // Mock chat history
    const welcomeMessage: ChatMessage = {
      id: `welcome_${assistantId}`,
      type: 'ai',
      message: `Hello Elizabeth! I'm ${assistant.name}. ${assistant.description}

How can I assist you today?`,
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      assistant_id: assistantId
    };

    setChatMessages([welcomeMessage]);
  };

  const createNewAissistent = () => {
    if (!isAdmin) {
      alert('Only administrators can create new AIssistents');
      return;
    }

    const newAissistent: AIssistent = {
      id: `new_${Date.now()}`,
      name: '',
      description: '',
      personality: '',
      expertise: [],
      style: 'supportive',
      access_level: 'personal',
      is_active: false,
      training_documents: [],
      chat_history_count: 0,
      created_at: new Date().toISOString(),
      created_by: user?.id || '',
      avatar_color: 'bg-gray-500'
    };

    setSelectedAissistent(newAissistent);
    setIsCreating(true);
    setActiveTab('settings');
  };

  const saveAissistent = useCallback(() => {
    if (!selectedAissistent || !selectedAissistent.name.trim()) return;

    const updatedAissistent = { 
      ...selectedAissistent, 
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (isCreating) {
      setAissistents(prev => [...prev, updatedAissistent]);
      setIsCreating(false);
      
      // Immediately select the newly created assistant
      setSelectedAissistent(updatedAissistent);
      loadChatHistory(updatedAissistent.id);
    } else {
      setAissistents(prev => 
        prev.map(a => a.id === selectedAissistent.id ? updatedAissistent : a)
      );
      setSelectedAissistent(updatedAissistent);
    }

    // Show success feedback
    console.log('✅ AIssistent saved successfully:', updatedAissistent.name);
  }, [selectedAissistent, isCreating]);

  const sendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isLoadingAI || !selectedAissistent) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date(),
      assistant_id: selectedAissistent.id
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoadingAI(true);

    try {
      const context = {
        assistant_name: selectedAissistent.name,
        assistant_personality: selectedAissistent.personality,
        assistant_expertise: selectedAissistent.expertise,
        assistant_style: selectedAissistent.style,
        user_name: 'Elizabeth',
        training_context: selectedAissistent.training_documents
          .filter(doc => doc.status === 'trained')
          .map(doc => doc.content_summary)
          .join(' ')
      };

      const response = await aiService.invokeChat(
        `[Acting as ${selectedAissistent.name}]: ${userMessage.message}`,
        context,
        {
          operation: 'aissistent_chat',
          priority: 'high',
          category: 'critical'
        }
      );

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        message: response.data?.message || response.message || 'I apologize, but I\'m having trouble responding right now.',
        timestamp: new Date(),
        assistant_id: selectedAissistent.id
      };

      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error chatting with AIssistent:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        message: 'I apologize, but I\'m having connection issues right now. Please try again in a moment.',
        timestamp: new Date(),
        assistant_id: selectedAissistent.id
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentMessage, isLoadingAI, selectedAissistent]);

  const handleFileUpload = (files: FileList) => {
    if (!selectedAissistent || !isAdmin) return;

    setUploadingFiles(true);

    // Process each file
    Array.from(files).forEach(file => {
      const newDoc: TrainingDocument = {
        id: `doc_${Date.now()}_${file.name}`,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 
              file.name.endsWith('.txt') ? 'txt' :
              file.name.endsWith('.docx') ? 'docx' : 'manual',
        size: file.size,
        uploaded_at: new Date().toISOString(),
        status: 'processing',
        content_summary: 'Processing document content...'
      };

      // Simulate processing delay
      setTimeout(() => {
        setSelectedAissistent(prev => prev ? {
          ...prev,
          training_documents: prev.training_documents.map(doc => 
            doc.id === newDoc.id 
              ? { ...doc, status: 'trained', content_summary: `Processed content from ${file.name}` }
              : doc
          )
        } : null);
      }, 2000);

      setSelectedAissistent(prev => prev ? {
        ...prev,
        training_documents: [...prev.training_documents, newDoc]
      } : null);
    });

    setUploadingFiles(false);
  };

  const AIssistentCard = ({ aissistent }: { aissistent: AIssistent }) => (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selectedAissistent?.id === aissistent.id 
          ? 'border-purple-500 bg-purple-50' 
          : 'border-gray-200 bg-white hover:border-purple-300'
      }`}
      onClick={() => {
        setSelectedAissistent(aissistent);
        loadChatHistory(aissistent.id);
      }}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-12 h-12 ${aissistent.avatar_color} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{aissistent.name}</h3>
            <div className="flex items-center space-x-2">
              {aissistent.is_active ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{aissistent.description}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {aissistent.chat_history_count} conversations
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              aissistent.style === 'supportive' ? 'bg-green-100 text-green-700' :
              aissistent.style === 'empowering' ? 'bg-blue-100 text-blue-700' :
              aissistent.style === 'motivational' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {aissistent.style}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const TrainingDocuments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Training Documents</h3>
        {isAdmin && (
          <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        )}
      </div>

      {selectedAissistent?.training_documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Documents</h3>
          <p className="text-gray-600">Upload documents to train this AIssistent</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedAissistent?.training_documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  <p className="text-sm text-gray-600">{doc.content_summary}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {doc.size && (doc.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doc.status === 'trained' ? 'bg-green-100 text-green-700' :
                  doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {doc.status}
                </span>
                {isAdmin && (
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ChatInterface = () => (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <div className={`w-6 h-6 ${selectedAissistent?.avatar_color || 'bg-purple-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                {message.type === 'user' && <User className="h-4 w-4 mt-1 text-purple-100 flex-shrink-0" />}
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          </div>
        ))}
        {isLoadingAI && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 ${selectedAissistent?.avatar_color || 'bg-purple-500'} rounded-full flex items-center justify-center`}>
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={`Chat with ${selectedAissistent?.name || 'AIssistent'}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoadingAI}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoadingAI}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AIssistents</h1>
          <p className="text-gray-600 mt-2">Your personalized AI assistants with custom training and expertise</p>
        </div>
        {isAdmin && (
          <button
            onClick={createNewAissistent}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New AIssistent
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AIssistents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your AIssistents</h2>
          {aissistents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AIssistents Yet</h3>
              <p className="text-gray-600">Create your first AI assistant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aissistents.map((aissistent) => (
                <AIssistentCard key={aissistent.id} aissistent={aissistent} />
              ))}
            </div>
          )}
        </div>

        {/* AIssistent Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAissistent ? (
            <>
              {/* Tab Navigation */}
              <div className="bg-white rounded-lg border border-gray-200 p-1">
                <div className="flex space-x-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                    { id: 'training', label: 'Training', icon: Brain },
                    ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-16 h-16 ${selectedAissistent.avatar_color} rounded-full flex items-center justify-center`}>
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{selectedAissistent.name}</h3>
                        <p className="text-gray-600 mt-1">{selectedAissistent.description}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            selectedAissistent.style === 'supportive' ? 'bg-green-100 text-green-700' :
                            selectedAissistent.style === 'empowering' ? 'bg-blue-100 text-blue-700' :
                            selectedAissistent.style === 'motivational' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedAissistent.style} style
                          </span>
                          <span className="text-sm text-gray-500">
                            {selectedAissistent.chat_history_count} conversations
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Expertise Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAissistent.expertise.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Personality</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg">
                        {selectedAissistent.personality}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && <ChatInterface />}
                {activeTab === 'training' && <TrainingDocuments />}

                {activeTab === 'settings' && isAdmin && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={selectedAissistent.name}
                          onChange={(e) => setSelectedAissistent({...selectedAissistent, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                        <select
                          value={selectedAissistent.style}
                          onChange={(e) => setSelectedAissistent({...selectedAissistent, style: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="supportive">Supportive</option>
                          <option value="empowering">Empowering</option>
                          <option value="motivational">Motivational</option>
                          <option value="analytical">Analytical</option>
                          <option value="creative">Creative</option>
                          <option value="direct">Direct</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={selectedAissistent.description}
                        onChange={(e) => setSelectedAissistent({...selectedAissistent, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personality & Instructions</label>
                      <textarea
                        value={selectedAissistent.personality}
                        onChange={(e) => setSelectedAissistent({...selectedAissistent, personality: e.target.value})}
                        rows={6}
                        placeholder="Describe how this AIssistent should behave, its knowledge areas, communication style..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      {isCreating && (
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setSelectedAissistent(aissistents[0] || null);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={saveAissistent}
                        disabled={!selectedAissistent.name.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isCreating ? 'Create AIssistent' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an AIssistent</h3>
              <p className="text-gray-600">Choose an AIssistent to chat, train, or configure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}