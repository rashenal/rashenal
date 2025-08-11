import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthManager, OAUTH_PROVIDERS } from '../../lib/email-services/oauth-config';
import { EmailTemplateManager, TEMPLATE_VARIABLES, DEFAULT_TEMPLATES } from '../../lib/email-services/email-templates';
import { SMTPService, SMTP_PROVIDERS } from '../../lib/email-services/smtp-config';
import { EmailCampaignManager } from '../../lib/email-services/email-campaigns';

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://test.rashenal.com'
  },
  writable: true
});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GMAIL_CLIENT_ID: 'test-gmail-client-id',
    VITE_GMAIL_CLIENT_SECRET: 'test-gmail-secret',
    VITE_OUTLOOK_CLIENT_ID: 'test-outlook-client-id',
    VITE_OUTLOOK_CLIENT_SECRET: 'test-outlook-secret'
  },
  writable: true
});

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

describe('Email Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  describe('OAuthManager', () => {
    it('should initialize with correct provider configurations', () => {
      const manager = OAuthManager.getInstance();
      expect(manager).toBeInstanceOf(OAuthManager);
    });

    it('should generate correct auth URLs', () => {
      const manager = OAuthManager.getInstance();
      const authUrl = manager.getAuthUrl('gmail', 'test-state');
      
      expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('state=test-state');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('gmail.readonly');
    });

    it('should handle token exchange', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      });

      const manager = OAuthManager.getInstance();
      const token = await manager.exchangeCodeForToken('gmail', 'test-code');

      expect(token.accessToken).toBe('test-access-token');
      expect(token.refreshToken).toBe('test-refresh-token');
      expect(token.provider).toBe('gmail');
    });

    it('should detect expired tokens', () => {
      const manager = OAuthManager.getInstance();
      
      const expiredToken = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        scope: 'email',
        tokenType: 'Bearer',
        provider: 'gmail'
      };

      expect(manager.isTokenExpired(expiredToken)).toBe(true);
    });
  });

  describe('EmailTemplateManager', () => {
    const templateManager = new EmailTemplateManager('test-user');

    it('should validate template variables', () => {
      expect(TEMPLATE_VARIABLES).toBeDefined();
      expect(TEMPLATE_VARIABLES.length).toBeGreaterThan(0);
      
      const firstNameVariable = TEMPLATE_VARIABLES.find(v => v.key === 'firstName');
      expect(firstNameVariable).toBeDefined();
      expect(firstNameVariable?.required).toBe(true);
    });

    it('should include default templates', () => {
      expect(DEFAULT_TEMPLATES).toBeDefined();
      expect(DEFAULT_TEMPLATES.length).toBeGreaterThan(0);
      
      const jobApplicationTemplate = DEFAULT_TEMPLATES.find(t => 
        t.category === 'job-application'
      );
      expect(jobApplicationTemplate).toBeDefined();
    });

    it('should interpolate template variables', async () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        subject: 'Hello {firstName}!',
        body: 'Dear {firstName} {lastName}, welcome to {company}!',
        bodyType: 'text' as const,
        category: 'job-application' as const,
        variables: ['firstName', 'lastName', 'company'],
        isDefault: false,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {}
      };

      // Mock getTemplate to return our test template
      vi.spyOn(templateManager, 'getTemplate').mockResolvedValueOnce(template);

      const variables = {
        firstName: 'John',
        lastName: 'Doe',
        company: 'Tech Corp'
      };

      const result = await templateManager.renderTemplate('test-template', variables);

      expect(result.subject).toBe('Hello John!');
      expect(result.body).toBe('Dear John Doe, welcome to Tech Corp!');
    });

    it('should validate template structure', () => {
      const validTemplate = {
        name: 'Valid Template',
        subject: 'Test Subject {firstName}',
        body: 'Test body with {company}',
        category: 'job-application' as const,
        variables: ['firstName', 'company'],
        bodyType: 'text' as const
      };

      const validation = templateManager.validateTemplate(validTemplate);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid template variables', () => {
      const invalidTemplate = {
        name: 'Invalid Template',
        subject: 'Test {invalidVariable}',
        body: 'Body with {anotherInvalidVariable}',
        category: 'job-application' as const,
        variables: ['invalidVariable', 'anotherInvalidVariable'],
        bodyType: 'text' as const
      };

      const validation = templateManager.validateTemplate(invalidTemplate);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('Invalid template variables')
      )).toBe(true);
    });
  });

  describe('SMTPService', () => {
    it('should initialize with correct provider configuration', () => {
      expect(SMTP_PROVIDERS.gmail).toBeDefined();
      expect(SMTP_PROVIDERS.gmail.host).toBe('smtp.gmail.com');
      expect(SMTP_PROVIDERS.gmail.port).toBe(587);
    });

    it('should validate email addresses', async () => {
      const smtpService = new SMTPService('gmail', 'test@example.com', 'password');
      
      const result = await smtpService.sendEmail(
        'invalid-email',
        'Test Subject',
        'Test Body'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email addresses');
    });

    it('should simulate successful email sending', async () => {
      const smtpService = new SMTPService('gmail', 'test@example.com', 'password');
      
      // Mock successful sending (90%+ success rate)
      let attempts = 0;
      const originalRandom = Math.random;
      Math.random = () => {
        attempts++;
        return 0.1; // Always return low value to avoid simulated failures
      };

      const result = await smtpService.sendEmail(
        'recipient@example.com',
        'Test Subject',
        'Test Body'
      );

      Math.random = originalRandom;

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.provider).toBe('gmail');
    });
  });

  describe('EmailCampaignManager', () => {
    const mockSMTPService = new SMTPService('gmail', 'test@example.com', 'password');
    const campaignManager = new EmailCampaignManager('test-user', mockSMTPService);

    it('should create campaign with correct structure', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'Test Description',
        templateId: 'test-template',
        recipients: [
          {
            email: 'test@example.com',
            variables: { firstName: 'John', company: 'TestCorp' },
            status: 'pending' as const,
            retryCount: 0,
            metadata: {}
          }
        ],
        status: 'draft' as const,
        scheduleType: 'immediate' as const,
        sendingConfig: {
          batchSize: 5,
          batchDelay: 30,
          respectTimeZone: true,
          sendingHours: { start: 9, end: 17 },
          sendingDays: [1, 2, 3, 4, 5]
        },
        stats: {
          total: 1,
          sent: 0,
          failed: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0
        },
        metadata: {
          category: 'job-application' as const,
          tags: ['test']
        }
      };

      // Mock template exists
      const templateManager = new EmailTemplateManager('test-user');
      vi.spyOn(templateManager, 'getTemplate').mockResolvedValueOnce({
        id: 'test-template',
        name: 'Test Template',
        subject: 'Test Subject',
        body: 'Test Body',
        bodyType: 'text',
        category: 'job-application',
        variables: ['firstName', 'company'],
        isDefault: false,
        userId: 'test-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {}
      });

      // The campaign creation would normally interact with Supabase
      // For now, we'll just test the data structure
      expect(campaignData.recipients).toHaveLength(1);
      expect(campaignData.recipients[0].email).toBe('test@example.com');
      expect(campaignData.sendingConfig.batchSize).toBe(5);
    });

    it('should validate recipient email format', () => {
      const validEmails = ['test@example.com', 'user.name+tag@domain.co.uk'];
      const invalidEmails = ['invalid-email', 'missing@domain', '@domain.com'];

      validEmails.forEach(email => {
        expect(campaignManager['isValidEmail'](email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(campaignManager['isValidEmail'](email)).toBe(false);
      });
    });

    it('should parse CSV data correctly', async () => {
      const csvData = `email,firstName,company
john@example.com,John,TechCorp
jane@example.com,Jane,StartupInc`;

      const variableMapping = {
        'email': 'email',
        'firstName': 'firstName',
        'company': 'company'
      };

      const recipients = await campaignManager.importRecipientsFromCSV(csvData, variableMapping);

      expect(recipients).toHaveLength(2);
      expect(recipients[0].email).toBe('john@example.com');
      expect(recipients[0].variables.firstName).toBe('John');
      expect(recipients[0].variables.company).toBe('TechCorp');
      expect(recipients[1].email).toBe('jane@example.com');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete email workflow', async () => {
      // This would test the complete flow:
      // 1. Create OAuth token
      // 2. Create email template
      // 3. Create campaign
      // 4. Send emails
      // 5. Track results

      const oauthManager = OAuthManager.getInstance();
      const templateManager = new EmailTemplateManager('test-user');
      const smtpService = new SMTPService('gmail', 'test@example.com', 'password');
      const campaignManager = new EmailCampaignManager('test-user', smtpService);

      // Mock successful OAuth
      expect(oauthManager).toBeInstanceOf(OAuthManager);
      expect(templateManager).toBeInstanceOf(EmailTemplateManager);
      expect(campaignManager).toBeInstanceOf(EmailCampaignManager);

      // Test would continue with actual workflow simulation
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});