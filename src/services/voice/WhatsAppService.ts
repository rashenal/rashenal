/**
 * WhatsApp Integration Service
 * Zero-code WhatsApp voice agent deployment
 */

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: number;
  type: 'text' | 'voice' | 'image';
  content: string;
  voiceUrl?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppVoiceResponse {
  text: string;
  voiceUrl?: string;
  quickReplies?: string[];
}

export class WhatsAppService {
  private webhookUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor(config: {
    webhookUrl: string;
    accessToken: string;
    phoneNumberId: string;
  }) {
    this.webhookUrl = config.webhookUrl;
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
  }

  /**
   * Send text message to WhatsApp
   */
  async sendTextMessage(to: string, message: string): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    };

    await this.makeWhatsAppRequest(payload);
  }

  /**
   * Send voice message to WhatsApp
   */
  async sendVoiceMessage(to: string, voiceUrl: string): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'audio',
      audio: { link: voiceUrl }
    };

    await this.makeWhatsAppRequest(payload);
  }

  /**
   * Send interactive message with quick reply buttons
   */
  async sendInteractiveMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title }
          }))
        }
      }
    };

    await this.makeWhatsAppRequest(payload);
  }

  /**
   * Download voice message from WhatsApp
   */
  async downloadVoiceMessage(mediaId: string): Promise<ArrayBuffer> {
    const mediaUrl = await this.getMediaUrl(mediaId);
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download voice message: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Get media URL from media ID
   */
  private async getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get media URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Make request to WhatsApp Business API
   */
  private async makeWhatsAppRequest(payload: any): Promise<any> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return response.json();
  }
}

/**
 * WhatsApp Webhook Handler
 * Processes incoming WhatsApp messages and routes to voice agents
 */
export class WhatsAppWebhookHandler {
  private voiceAgents: Map<string, any> = new Map();
  private userSessions: Map<string, any> = new Map();

  /**
   * Process incoming WhatsApp webhook
   */
  async processWebhook(req: any): Promise<any> {
    const body = req.body;

    // Verify webhook (if needed)
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
      return { 'hub.challenge': req.query['hub.challenge'] };
    }

    // Process incoming messages
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.handleMessage(change.value);
          }
        }
      }
    }

    return { status: 'success' };
  }

  /**
   * Handle individual WhatsApp message
   */
  private async handleMessage(messageData: any): Promise<void> {
    const messages = messageData.messages;
    if (!messages) return;

    for (const message of messages) {
      const userPhone = message.from;
      const messageType = message.type;

      try {
        let responseText = '';
        let voiceResponse = '';

        if (messageType === 'text') {
          const text = message.text.body;
          responseText = await this.processTextMessage(userPhone, text);
        } else if (messageType === 'audio') {
          const audioId = message.audio.id;
          responseText = await this.processVoiceMessage(userPhone, audioId);
        }

        // Send response back
        if (responseText) {
          await this.sendResponse(userPhone, responseText);
        }

      } catch (error) {
        console.error('Error processing WhatsApp message:', error);
        await this.sendErrorResponse(userPhone);
      }
    }
  }

  /**
   * Process text message and generate response
   */
  private async processTextMessage(userPhone: string, text: string): Promise<string> {
    // Get or create user session
    const session = this.getUserSession(userPhone);
    
    // Process with Claude AI (integrate with existing Rashenal AI service)
    const context = await this.buildUserContext(userPhone);
    const response = await this.generateAIResponse(text, context);

    // Update session
    session.lastMessage = text;
    session.lastResponse = response;
    session.timestamp = Date.now();

    return response;
  }

  /**
   * Process voice message and generate response
   */
  private async processVoiceMessage(userPhone: string, audioId: string): Promise<string> {
    // Download and transcribe voice message
    const whatsapp = new WhatsAppService({
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!
    });

    const audioBuffer = await whatsapp.downloadVoiceMessage(audioId);
    const transcript = await this.transcribeAudio(audioBuffer);

    // Process as text
    return this.processTextMessage(userPhone, transcript);
  }

  /**
   * Send response back to user
   */
  private async sendResponse(userPhone: string, responseText: string): Promise<void> {
    const whatsapp = new WhatsAppService({
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!
    });

    // Send text response
    await whatsapp.sendTextMessage(userPhone, responseText);

    // TODO: Generate and send voice response if user prefers audio
    // const voiceUrl = await this.generateVoiceResponse(responseText, userPhone);
    // await whatsapp.sendVoiceMessage(userPhone, voiceUrl);
  }

  /**
   * Send error response
   */
  private async sendErrorResponse(userPhone: string): Promise<void> {
    const errorMessage = "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment.";
    
    const whatsapp = new WhatsAppService({
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!
    });

    await whatsapp.sendTextMessage(userPhone, errorMessage);
  }

  /**
   * Get or create user session
   */
  private getUserSession(userPhone: string): any {
    if (!this.userSessions.has(userPhone)) {
      this.userSessions.set(userPhone, {
        phone: userPhone,
        createdAt: Date.now(),
        messageCount: 0,
        preferences: {}
      });
    }

    const session = this.userSessions.get(userPhone);
    session.messageCount++;
    return session;
  }

  /**
   * Build user context for AI response
   */
  private async buildUserContext(userPhone: string): Promise<any> {
    // TODO: Integrate with Rashenal user data
    // - Get user's habits, goals, tasks
    // - Get conversation history
    // - Get user preferences and voice agent config
    
    return {
      userPhone,
      timestamp: new Date().toISOString(),
      platform: 'whatsapp'
    };
  }

  /**
   * Generate AI response using Claude
   */
  private async generateAIResponse(message: string, context: any): Promise<string> {
    // TODO: Integrate with existing Rashenal Claude service
    // This should use the same AI service that powers the web app
    
    return `Thanks for your message: "${message}". I'm working on integrating with your full Rashenal data!`;
  }

  /**
   * Transcribe audio to text
   */
  private async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
    // TODO: Integrate with speech-to-text service
    // Could use OpenAI Whisper API or similar
    
    return '[Voice message transcription coming soon]';
  }

  /**
   * Generate voice response
   */
  private async generateVoiceResponse(text: string, userPhone: string): Promise<string> {
    // TODO: Generate voice using user's custom voice or default
    // Return URL to generated audio file
    
    return '';
  }
}

// Environment configuration
export const getWhatsAppConfig = () => ({
  webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'rashenal-voice-agent'
});
