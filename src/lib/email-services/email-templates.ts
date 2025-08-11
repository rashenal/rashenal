// Email template system for job search communications
import { supabase } from '../supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  category: 'job-application' | 'follow-up' | 'thank-you' | 'networking' | 'cold-outreach' | 'interview-request' | 'salary-negotiation';
  variables: string[]; // Available template variables like {company}, {position}
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    description?: string;
    tags?: string[];
    successRate?: number;
    responseRate?: number;
    lastUsed?: string;
  };
}

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  type: 'text' | 'email' | 'url' | 'number' | 'date';
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: 'firstName', label: 'Your First Name', description: 'Your first name', required: true, type: 'text' },
  { key: 'lastName', label: 'Your Last Name', description: 'Your last name', required: true, type: 'text' },
  { key: 'fullName', label: 'Your Full Name', description: 'Your complete name', required: true, type: 'text' },
  { key: 'email', label: 'Your Email', description: 'Your email address', required: true, type: 'email' },
  { key: 'phone', label: 'Your Phone', description: 'Your phone number', required: false, type: 'text' },
  { key: 'company', label: 'Company Name', description: 'Name of the company', required: true, type: 'text' },
  { key: 'position', label: 'Position Title', description: 'Job position title', required: true, type: 'text' },
  { key: 'jobId', label: 'Job ID', description: 'Job posting ID or reference', required: false, type: 'text' },
  { key: 'hiringManager', label: 'Hiring Manager', description: 'Name of hiring manager', required: false, type: 'text' },
  { key: 'recruiter', label: 'Recruiter Name', description: 'Name of recruiter', required: false, type: 'text' },
  { key: 'salary', label: 'Salary Expectation', description: 'Expected salary range', required: false, type: 'text' },
  { key: 'startDate', label: 'Start Date', description: 'Available start date', required: false, type: 'date' },
  { key: 'websiteUrl', label: 'Portfolio URL', description: 'Your portfolio website', required: false, type: 'url' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', description: 'Your LinkedIn profile', required: false, type: 'url' },
  { key: 'githubUrl', label: 'GitHub URL', description: 'Your GitHub profile', required: false, type: 'url' },
  { key: 'skills', label: 'Key Skills', description: 'Relevant skills for the position', required: false, type: 'text' },
  { key: 'experience', label: 'Years of Experience', description: 'Years of relevant experience', required: false, type: 'number' },
  { key: 'location', label: 'Your Location', description: 'Your current location', required: false, type: 'text' },
  { key: 'referral', label: 'Referral Name', description: 'Name of person who referred you', required: false, type: 'text' },
  { key: 'interviewDate', label: 'Interview Date', description: 'Date of interview', required: false, type: 'date' },
  { key: 'currentRole', label: 'Current Role', description: 'Your current job title', required: false, type: 'text' },
  { key: 'currentCompany', label: 'Current Company', description: 'Your current employer', required: false, type: 'text' }
];

export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Job Application - Software Developer',
    subject: 'Application for {position} at {company}',
    body: `Dear Hiring Manager,

I am writing to express my interest in the {position} position at {company}. With {experience} years of experience in software development and expertise in {skills}, I am confident I would be a valuable addition to your team.

In my current role as {currentRole} at {currentCompany}, I have successfully:
• Developed and maintained scalable web applications
• Collaborated with cross-functional teams to deliver high-quality software solutions
• Implemented best practices for code quality and performance optimization

I am particularly drawn to {company} because of your commitment to innovation and technical excellence. I would welcome the opportunity to discuss how my background in {skills} can contribute to your team's continued success.

Please find my resume attached for your review. I am available to start on {startDate} and would be happy to discuss my qualifications further in an interview.

Thank you for your time and consideration.

Best regards,
{fullName}
{email}
{phone}
Portfolio: {websiteUrl}
LinkedIn: {linkedinUrl}`,
    bodyType: 'text',
    category: 'job-application',
    variables: ['fullName', 'email', 'phone', 'company', 'position', 'experience', 'skills', 'currentRole', 'currentCompany', 'startDate', 'websiteUrl', 'linkedinUrl'],
    isDefault: true,
    metadata: {
      description: 'Professional job application template for software development positions',
      tags: ['software', 'developer', 'application'],
      successRate: 0.75
    }
  },
  {
    name: 'Follow-up After Application',
    subject: 'Following up on my application for {position}',
    body: `Dear {hiringManager},

I hope this email finds you well. I wanted to follow up on my application for the {position} position at {company}, which I submitted on [date].

I remain very interested in this opportunity and would welcome the chance to discuss how my experience in {skills} aligns with your team's needs. I believe my background in {currentRole} at {currentCompany} has prepared me well for the challenges and responsibilities of this role.

If you need any additional information or would like to schedule a conversation, please don't hesitate to reach out. I am available at your convenience and look forward to hearing from you.

Thank you again for considering my application.

Best regards,
{fullName}
{email}
{phone}`,
    bodyType: 'text',
    category: 'follow-up',
    variables: ['fullName', 'email', 'phone', 'company', 'position', 'hiringManager', 'skills', 'currentRole', 'currentCompany'],
    isDefault: true,
    metadata: {
      description: 'Polite follow-up template for checking application status',
      tags: ['follow-up', 'application', 'status'],
      responseRate: 0.45
    }
  },
  {
    name: 'Thank You After Interview',
    subject: 'Thank you for the interview - {position} at {company}',
    body: `Dear {hiringManager},

Thank you for taking the time to interview me yesterday for the {position} position at {company}. I enjoyed our conversation about [specific topic discussed] and learning more about your team's innovative approach to [relevant area].

Our discussion reinforced my enthusiasm for this role and my desire to contribute to {company}'s continued success. I'm particularly excited about the opportunity to [specific project or responsibility mentioned in interview] and believe my experience in {skills} would enable me to make an immediate impact.

If you need any additional information from me, please don't hesitate to ask. I look forward to the next steps in the process and hope to hear from you soon.

Thank you again for your time and consideration.

Best regards,
{fullName}
{email}
{phone}`,
    bodyType: 'text',
    category: 'thank-you',
    variables: ['fullName', 'email', 'phone', 'company', 'position', 'hiringManager', 'skills'],
    isDefault: true,
    metadata: {
      description: 'Post-interview thank you note template',
      tags: ['interview', 'thank-you', 'follow-up'],
      successRate: 0.85
    }
  },
  {
    name: 'Networking Outreach',
    subject: 'Exploring opportunities in {company}',
    body: `Hi {hiringManager},

I hope you're doing well. I came across your profile on LinkedIn and was impressed by your work at {company}, particularly [specific project or achievement].

I'm a {currentRole} with {experience} years of experience in {skills}, and I'm currently exploring new opportunities in [industry/field]. I'm particularly interested in {company} because of [specific reason related to company].

I would love to learn more about your experience at {company} and any advice you might have for someone looking to join your industry. Would you be available for a brief 15-minute call in the coming weeks?

I understand you're busy, so no pressure at all. Even a few minutes of your insights would be incredibly valuable.

Thank you for your time, and I hope to connect soon.

Best regards,
{fullName}
{email}
{linkedinUrl}`,
    bodyType: 'text',
    category: 'networking',
    variables: ['fullName', 'email', 'company', 'hiringManager', 'currentRole', 'experience', 'skills', 'linkedinUrl'],
    isDefault: true,
    metadata: {
      description: 'Professional networking outreach template',
      tags: ['networking', 'outreach', 'connection'],
      responseRate: 0.35
    }
  },
  {
    name: 'Salary Negotiation',
    subject: 'Re: Offer for {position} at {company}',
    body: `Dear {hiringManager},

Thank you for extending the offer for the {position} role at {company}. I'm very excited about the opportunity to join your team and contribute to [specific goal or project].

After careful consideration of the compensation package, I would like to discuss the base salary component. Based on my research of market rates for similar positions in this area, as well as my {experience} years of experience and proven track record in {skills}, I believe a salary of {salary} would be more appropriate for this role.

I'm confident that my expertise in [specific skills/achievements] will provide significant value to {company}, and I'm eager to discuss how we can reach a mutually beneficial agreement.

I'm happy to discuss this further at your convenience. Thank you again for this opportunity, and I look forward to hearing from you.

Best regards,
{fullName}
{email}
{phone}`,
    bodyType: 'text',
    category: 'salary-negotiation',
    variables: ['fullName', 'email', 'phone', 'company', 'position', 'hiringManager', 'salary', 'experience', 'skills'],
    isDefault: true,
    metadata: {
      description: 'Professional salary negotiation template',
      tags: ['negotiation', 'salary', 'offer'],
      successRate: 0.65
    }
  }
];

export class EmailTemplateManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getTemplates(category?: EmailTemplate['category']): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    return data;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        user_id: this.userId,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data;
  }

  async updateTemplate(id: string, updates: Partial<Omit<EmailTemplate, 'id' | 'userId' | 'createdAt'>>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const subject = this.interpolateTemplate(template.subject, variables);
    const body = this.interpolateTemplate(template.body, variables);

    return { subject, body };
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Replace template variables in {variable} format
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value || `[${key}]`);
    }

    // Handle conditional sections [if:variable]content[/if]
    result = result.replace(/\[if:(\w+)\](.*?)\[\/if\]/gs, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    // Handle optional sections [optional:variable]content[/optional] - shows content only if variable exists
    result = result.replace(/\[optional:(\w+)\](.*?)\[\/optional\]/gs, (match, variable, content) => {
      return variables[variable] ? this.interpolateTemplate(content, variables) : '';
    });

    return result;
  }

  async installDefaultTemplates(): Promise<void> {
    const existingTemplates = await this.getTemplates();
    const existingNames = new Set(existingTemplates.map(t => t.name));

    for (const template of DEFAULT_TEMPLATES) {
      if (!existingNames.has(template.name)) {
        await this.createTemplate(template);
      }
    }
  }

  async getTemplateAnalytics(templateId: string): Promise<{
    usageCount: number;
    lastUsed: string | null;
    averageResponseTime: number | null;
    successRate: number | null;
  }> {
    // This would integrate with email campaign data
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('created_at, stats')
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`Failed to fetch template analytics: ${error.message}`);
    }

    const campaigns = data || [];
    const usageCount = campaigns.length;
    const lastUsed = campaigns.length > 0 ? 
      Math.max(...campaigns.map(c => new Date(c.created_at).getTime())) : null;

    let totalSent = 0;
    let totalDelivered = 0;
    
    campaigns.forEach(campaign => {
      if (campaign.stats) {
        totalSent += campaign.stats.sent || 0;
        totalDelivered += campaign.stats.delivered || 0;
      }
    });

    const successRate = totalSent > 0 ? totalDelivered / totalSent : null;

    return {
      usageCount,
      lastUsed: lastUsed ? new Date(lastUsed).toISOString() : null,
      averageResponseTime: null, // Would require more complex tracking
      successRate
    };
  }

  validateTemplate(template: Partial<EmailTemplate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.subject?.trim()) {
      errors.push('Subject is required');
    }

    if (!template.body?.trim()) {
      errors.push('Body is required');
    }

    if (!template.category) {
      errors.push('Category is required');
    }

    // Validate template variables
    const templateText = `${template.subject} ${template.body}`;
    const variableMatches = templateText.match(/\{(\w+)\}/g) || [];
    const usedVariables = variableMatches.map(match => match.slice(1, -1));
    const invalidVariables = usedVariables.filter(
      variable => !TEMPLATE_VARIABLES.some(tv => tv.key === variable)
    );

    if (invalidVariables.length > 0) {
      errors.push(`Invalid template variables: ${invalidVariables.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default EmailTemplateManager;