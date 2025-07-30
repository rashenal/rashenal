import { useState, useEffect } from 'react';
import { database, AIChatMessage } from '@lib/database';
import { useAuth } from '@contexts/AuthContext';

export function useAIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const chatMessages = await database.getChatMessages(user.id);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      setSending(true);
      
      // Save user message
      const userMessage = await database.saveChatMessage({
        user_id: user.id,
        message: message.trim(),
        sender: 'user'
      });

      if (userMessage) {
        setMessages(prev => [...prev, userMessage]);
      }

      // Generate AI response (simplified for now)
      const aiResponse = generateAIResponse(message);
      
      // Save AI message
      const aiMessage = await database.saveChatMessage({
        user_id: user.id,
        message: aiResponse,
        sender: 'ai'
      });

      if (aiMessage) {
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
}

// Simple AI response generator (in a real app, this would call an AI API)
function generateAIResponse(userMessage: string): string {
  const responses = [
    "That's great progress! Keep up the excellent work. How are you feeling about your current habits?",
    "I'm here to support you on your transformation journey. What would you like to focus on today?",
    "Your consistency is impressive! Remember, small daily actions lead to big transformations.",
    "I notice you're building some strong habits. What's motivating you the most right now?",
    "Every step forward is progress. What's one thing you're proud of accomplishing recently?",
    "Your dedication is inspiring! How can I help you stay on track with your goals?",
    "I'm seeing great momentum in your journey. What challenges are you facing that I can help with?",
    "You're doing amazing! Remember, transformation is a process, not a destination."
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('meditation') || lowerMessage.includes('mindful')) {
    return "Meditation is such a powerful practice! How has it been affecting your daily life and stress levels?";
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
    return "Physical activity is fantastic for both body and mind! What type of exercise are you enjoying most?";
  }
  
  if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
    return "Setting clear goals is crucial for success! What's your most important goal right now, and how can I help you achieve it?";
  }
  
  if (lowerMessage.includes('struggle') || lowerMessage.includes('difficult') || lowerMessage.includes('hard')) {
    return "I understand that transformation can be challenging. Remember, every expert was once a beginner. What specific area would you like support with?";
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
    return "You're so welcome! I'm here to support your journey every step of the way. What would you like to work on next?";
  }

  // Return a random response if no keywords match
  return responses[Math.floor(Math.random() * responses.length)];
}