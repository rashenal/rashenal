// Email Job Processor - Simulates processing emails to find job opportunities
import { supabase } from './supabase';

interface SimulatedEmail {
  id: string;
  subject: string;
  from: string;
  content: string;
  receivedAt: string;
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'company';
}

interface ExtractedJob {
  title: string;
  company: string;
  location: string;
  salary_range?: string;
  description: string;
  requirements: string[];
  posted_date: string;
  application_url?: string;
  source: string;
  match_score: number;
}

// Real LinkedIn job alert parsing
const parseLinkedInJobAlert = (emailContent: string): ExtractedJob[] => {
  const jobs: ExtractedJob[] = [];
  
  // Pattern to match LinkedIn job entries like:
  // Company Name
  // Job Title
  // Company · Location (Type)
  const jobPattern = /([A-Za-z\s&.,]+)\s*\n\s*([A-Za-z\s\-()]+)\s*\n\s*([A-Za-z\s&.,]+)\s*·\s*([A-Za-z\s,()]+)/g;
  
  let match;
  while ((match = jobPattern.exec(emailContent)) !== null) {
    const [, company, title, , location] = match;
    
    // Clean up extracted data
    const cleanTitle = title.trim();
    const cleanCompany = company.trim();
    const cleanLocation = location.replace(/\([^)]*\)/, '').trim(); // Remove (Hybrid), (Remote) etc
    const locationType = location.includes('Hybrid') ? 'Hybrid' : location.includes('Remote') ? 'Remote' : 'On-site';
    
    // Calculate match score based on keywords
    let matchScore = 70; // Base score for LinkedIn jobs
    const content = emailContent.toLowerCase();
    if (content.includes('agile') || content.includes('scrum')) matchScore += 15;
    if (content.includes('coach') || content.includes('manager')) matchScore += 10;
    if (content.includes('london')) matchScore += 5;
    if (content.includes('hybrid')) matchScore += 5;
    
    jobs.push({
      title: cleanTitle,
      company: cleanCompany,
      location: `${cleanLocation} (${locationType})`,
      description: `${cleanTitle} position at ${cleanCompany} in ${cleanLocation}. Found via LinkedIn job alert.`,
      requirements: extractRequirements(emailContent),
      posted_date: new Date().toISOString(),
      application_url: undefined, // Will need to scrape LinkedIn for actual URL
      source: 'linkedin_email',
      match_score: Math.min(matchScore, 100)
    });
  }
  
  return jobs;
};

// Generate a week's worth of job alerts (more realistic volume)
const generateWeekOfJobAlerts = (): SimulatedEmail[] => {
  const emails: SimulatedEmail[] = [];
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
  
  // LinkedIn job alert templates
  const linkedinJobs = [
    { company: 'Kingfisher plc', title: 'Lead Agile Coach (FTC)', location: 'London (Hybrid)' },
    { company: 'TechShack', title: 'Technical Scrum Master', location: 'London Area, United Kingdom (Hybrid)' },
    { company: 'Mastercard', title: 'Technical Program Manager (Scrum Master Team Coach)', location: 'London (Hybrid)' },
    { company: 'Sprint Reply UK', title: 'Delivery Manager', location: 'London Area, United Kingdom (Hybrid)' },
    { company: 'NatWest Boxed', title: 'Specialist Delivery Manager - Colleague Experience', location: 'London (Hybrid)' },
    { company: 'Just Eat Takeaway.com', title: 'Technical Program Manager', location: 'London (Hybrid)' },
    { company: 'Barclays', title: 'Senior Agile Coach', location: 'London (Hybrid)' },
    { company: 'HSBC', title: 'Scrum Master', location: 'London (Remote)' },
    { company: 'Goldman Sachs', title: 'Technical Delivery Lead', location: 'London (Hybrid)' },
    { company: 'JP Morgan', title: 'Agile Transformation Coach', location: 'London (On-site)' }
  ];

  const indeedJobs = [
    { company: 'Amazon', title: 'Senior Software Engineer', location: 'London', salary: '£80,000 - £120,000 a year' },
    { company: 'Google', title: 'Software Development Engineer', location: 'London', salary: '£85,000 - £130,000 a year' },
    { company: 'Microsoft', title: 'Principal Engineer', location: 'London', salary: '£90,000 - £140,000 a year' },
    { company: 'Meta', title: 'Staff Software Engineer', location: 'London', salary: '£95,000 - £150,000 a year' },
    { company: 'Startup Tech Ltd', title: 'React Developer', location: 'Remote', salary: '£45,000 - £65,000 a year' },
    { company: 'Financial Services Corp', title: 'DevOps Engineer', location: 'London', salary: '£70,000 - £90,000 a year' }
  ];

  const glassdoorJobs = [
    { company: 'TechCorp London', title: 'Full Stack Developer', salary: '£55k-£75k', rating: '4.2★' },
    { company: 'DataSoft Ltd', title: 'Backend Engineer', salary: '£65k-£85k', rating: '4.5★' },
    { company: 'WebAgency Pro', title: 'Frontend Developer', salary: '£50k-£70k', rating: '3.8★' },
    { company: 'FinTech Innovations', title: 'Senior Developer', salary: '£75k-£95k', rating: '4.1★' },
    { company: 'CloudTech Solutions', title: 'DevOps Engineer', salary: '£60k-£80k', rating: '4.0★' }
  ];

  // Generate emails over the past week (3-5 emails per day)
  for (let day = 0; day < 7; day++) {
    const emailsToday = Math.floor(Math.random() * 3) + 3; // 3-5 emails per day
    
    for (let email = 0; email < emailsToday; email++) {
      const timeOffset = now - (day * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000);
      const source = ['linkedin', 'indeed', 'glassdoor'][Math.floor(Math.random() * 3)] as 'linkedin' | 'indeed' | 'glassdoor';
      
      if (source === 'linkedin') {
        const jobs = linkedinJobs.slice(0, Math.floor(Math.random() * 3) + 3); // 3-6 jobs per email
        emails.push({
          id: `linkedin-${day}-${email}`,
          subject: 'Your job alert for agile coach',
          from: 'noreply@linkedin.com',
          content: `LinkedIn
Your job alert for agile coach
New jobs in London match your preferences.

${jobs.map(job => `${job.company}
${job.title}
${job.company} · ${job.location}
Actively recruiting`).join('\n\n')}`,
          receivedAt: new Date(timeOffset).toISOString(),
          source: 'linkedin'
        });
      } else if (source === 'indeed') {
        const jobs = indeedJobs.slice(0, Math.floor(Math.random() * 2) + 2); // 2-4 jobs per email
        emails.push({
          id: `indeed-${day}-${email}`,
          subject: 'Indeed Job Alert: New jobs for software engineer',
          from: 'noreply@indeed.com',
          content: `New jobs matching your preferences:

${jobs.map(job => `${job.title}
${job.company}
${job.location}
${job.salary}
Full-time, Permanent`).join('\n\n')}`,
          receivedAt: new Date(timeOffset).toISOString(),
          source: 'indeed'
        });
      } else {
        const jobs = glassdoorJobs.slice(0, Math.floor(Math.random() * 2) + 2); // 2-4 jobs per email
        emails.push({
          id: `glassdoor-${day}-${email}`,
          subject: 'Glassdoor Job Alert: Programming jobs',
          from: 'jobs@glassdoor.com',
          content: `New programming jobs in London:

${jobs.map(job => `${job.title} - ${job.salary}
${job.company}
${job.rating} rating`).join('\n\n')}`,
          receivedAt: new Date(timeOffset).toISOString(),
          source: 'glassdoor'
        });
      }
    }
  }
  
  return emails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
};

// Generate the week's worth of emails
const simulatedRealEmails = generateWeekOfJobAlerts();

// Parse Indeed job alerts
const parseIndeedJobAlert = (emailContent: string): ExtractedJob[] => {
  const jobs: ExtractedJob[] = [];
  
  // Pattern for Indeed format:
  // Job Title
  // Company
  // Location
  // Salary
  // Type
  const jobPattern = /([A-Za-z\s\-()]+)\n([A-Za-z\s&.,Ltd]+)\n([A-Za-z\s,]+)\n(£[\d,]+ - £[\d,]+ a year|[\d,]+ - [\d,]+ a year)\n([A-Za-z\s,-]+)/g;
  
  let match;
  while ((match = jobPattern.exec(emailContent)) !== null) {
    const [, title, company, location, salary, type] = match;
    
    jobs.push({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      salary_range: salary.trim(),
      description: `${title.trim()} at ${company.trim()} - ${type.trim()}. Found via Indeed job alert.`,
      requirements: extractRequirements(emailContent),
      posted_date: new Date().toISOString(),
      application_url: undefined,
      source: 'indeed_email',
      match_score: 75
    });
  }
  
  return jobs;
};

// Parse Glassdoor job alerts  
const parseGlassdoorJobAlert = (emailContent: string): ExtractedJob[] => {
  const jobs: ExtractedJob[] = [];
  
  // Pattern for Glassdoor format:
  // Job Title - Salary
  // Company Name
  // Rating
  const jobPattern = /([A-Za-z\s\-()]+) - (£[\dk-]+)\n([A-Za-z\s&.,Ltd]+)\n([\d.]+★ rating)/g;
  
  let match;
  while ((match = jobPattern.exec(emailContent)) !== null) {
    const [, title, salary, company, rating] = match;
    
    jobs.push({
      title: title.trim(),
      company: company.trim(),
      location: 'London', // Default from example
      salary_range: salary.trim(),
      description: `${title.trim()} at ${company.trim()} (${rating.trim()}). Found via Glassdoor job alert.`,
      requirements: extractRequirements(emailContent),
      posted_date: new Date().toISOString(),
      application_url: undefined,
      source: 'glassdoor_email',
      match_score: 70
    });
  }
  
  return jobs;
};

// Enhanced job extraction using real parsers
function extractJobsFromEmail(email: SimulatedEmail): ExtractedJob[] {
  const jobs: ExtractedJob[] = [];
  
  // Use specific parser based on email source
  switch (email.source) {
    case 'linkedin':
      return parseLinkedInJobAlert(email.content);
    case 'indeed':
      return parseIndeedJobAlert(email.content);
    case 'glassdoor':
      return parseGlassdoorJobAlert(email.content);
    default:
      // Fallback to basic extraction
      const job = extractJobFromEmailBasic(email);
      return job ? [job] : [];
  }
}

// Basic extraction for unknown formats (legacy)
function extractJobFromEmailBasic(email: SimulatedEmail): ExtractedJob | null {
  const content = email.content.toLowerCase();
  
  // Simple keyword-based extraction (in reality, this would use Claude API)
  if (content.includes('developer') || content.includes('engineer') || content.includes('programmer') ||
      content.includes('coach') || content.includes('manager') || content.includes('scrum')) {
    
    // Extract salary
    const salaryMatch = email.content.match(/[\$£€]?(\d{2,3}[,.]?\d{3})\s*[-–]\s*[\$£€]?(\d{2,3}[,.]?\d{3})/);
    const singleSalaryMatch = email.content.match(/[\$£€](\d{2,3}[,.]?\d{3})/);
    
    let salary_range = '';
    if (salaryMatch) {
      salary_range = `${salaryMatch[0]}`;
    } else if (singleSalaryMatch) {
      salary_range = `${singleSalaryMatch[0]}`;
    }
    
    // Extract location
    const locations = ['London', 'Remote', 'New York', 'San Francisco', 'Berlin', 'Hybrid'];
    const location = locations.find(loc => email.content.includes(loc)) || 'Not specified';
    
    // Extract company
    const companyMatch = email.content.match(/at ([A-Z][a-zA-Z\s]+)/);
    const company = companyMatch ? companyMatch[1].trim() : getCompanyFromEmail(email);
    
    // Extract title
    const titleMatch = email.subject.match(/(Senior |Junior |Lead )?([A-Z][a-zA-Z\s]+ (?:Developer|Engineer|Coach|Manager))/);
    const title = titleMatch ? titleMatch[0] : 'Software Developer';
    
    // Calculate match score based on keywords
    let matchScore = 60; // Base score
    if (content.includes('react')) matchScore += 15;
    if (content.includes('typescript')) matchScore += 10;
    if (content.includes('node')) matchScore += 10;
    if (content.includes('remote')) matchScore += 5;
    if (content.includes('agile') || content.includes('scrum')) matchScore += 15;
    if (salary_range) matchScore += 10;
    
    return {
      title: title,
      company: company,
      location: location,
      salary_range: salary_range || undefined,
      description: email.content,
      requirements: extractRequirements(email.content),
      posted_date: email.receivedAt,
      application_url: extractApplicationUrl(email.content),
      source: `${email.source}_email`,
      match_score: Math.min(matchScore, 100)
    };
  }
  
  return null;
}

function getCompanyFromEmail(email: SimulatedEmail): string {
  if (email.source === 'linkedin') return 'LinkedIn Job Alert';
  if (email.source === 'indeed') return 'Indeed Job Alert';
  if (email.source === 'glassdoor') return 'Glassdoor Job Alert';
  
  const domain = email.from.split('@')[1];
  return domain.replace('.com', '').replace(/\b\w/g, l => l.toUpperCase());
}

function extractRequirements(content: string): string[] {
  const requirements = [];
  if (content.toLowerCase().includes('react')) requirements.push('React');
  if (content.toLowerCase().includes('typescript')) requirements.push('TypeScript');
  if (content.toLowerCase().includes('node')) requirements.push('Node.js');
  if (content.toLowerCase().includes('python')) requirements.push('Python');
  if (content.toLowerCase().includes('postgresql')) requirements.push('PostgreSQL');
  if (content.toLowerCase().includes('css')) requirements.push('CSS');
  if (content.toLowerCase().includes('testing')) requirements.push('Testing');
  
  return requirements.length > 0 ? requirements : ['General programming experience'];
}

function extractApplicationUrl(content: string): string | undefined {
  const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[0] : undefined;
}

// Main function to simulate email processing
export class EmailJobProcessor {
  // Get the minimum match score threshold (default 80%)
  static getMatchThreshold(): number {
    const threshold = localStorage.getItem('job_match_threshold');
    return threshold ? parseInt(threshold) : 80;
  }

  // Set the minimum match score threshold
  static setMatchThreshold(threshold: number): void {
    localStorage.setItem('job_match_threshold', threshold.toString());
  }

  // Get the last processing timestamp
  static getLastProcessedTime(): Date | null {
    const lastProcessed = localStorage.getItem('last_email_processed');
    return lastProcessed ? new Date(lastProcessed) : null;
  }

  // Set the last processing timestamp
  static setLastProcessedTime(timestamp: Date): void {
    localStorage.setItem('last_email_processed', timestamp.toISOString());
  }

  static async processInboxForJobs(userId: string, fromDate?: Date): Promise<{
    emailsProcessed: number;
    jobsFound: number;
    jobsAdded: number;
    belowThreshold: number;
  }> {
    try {
      const matchThreshold = this.getMatchThreshold();
      const lastProcessed = fromDate || this.getLastProcessedTime() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 1 week ago
      
      console.log(`Starting email processing from ${lastProcessed.toISOString()} with ${matchThreshold}% minimum match threshold...`);
      
      let jobsFound = 0;
      let jobsAdded = 0;
      let belowThreshold = 0;
      
      // Filter emails to only process those after the last processed time
      const emailsToProcess = simulatedRealEmails.filter(email => 
        new Date(email.receivedAt) > lastProcessed
      );
      
      console.log(`Found ${emailsToProcess.length} new emails to process (out of ${simulatedRealEmails.length} total)`);
      
      // First, get user's job profiles to determine matching
      const { data: profiles } = await supabase
        .from('job_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      const defaultProfile = profiles?.[0];
      
      // Process each real email format
      for (const email of emailsToProcess) {
        console.log(`Processing ${email.source} email: ${email.subject} (${email.receivedAt})`);
        const extractedJobs = extractJobsFromEmail(email);
        
        for (const extractedJob of extractedJobs) {
          jobsFound++;
          
          // Check match score against threshold
          if (extractedJob.match_score < matchThreshold) {
            belowThreshold++;
            console.log(`Skipping job below threshold: ${extractedJob.title} at ${extractedJob.company} (${extractedJob.match_score}% < ${matchThreshold}%)`);
            continue;
          }
          
          // Check if we already have this job
          const { data: existingMatch } = await supabase
            .from('job_matches')
            .select('id')
            .eq('user_id', userId)
            .eq('title', extractedJob.title)
            .eq('company', extractedJob.company)
            .limit(1);
          
          if (!existingMatch || existingMatch.length === 0) {
            // Add new job match
            const { error } = await supabase
              .from('job_matches')
              .insert({
                user_id: userId,
                job_profile_id: defaultProfile?.id || null,
                title: extractedJob.title,
                company: extractedJob.company,
                location: extractedJob.location,
                salary_range: extractedJob.salary_range,
                description: extractedJob.description,
                requirements: extractedJob.requirements,
                posted_date: extractedJob.posted_date,
                application_url: extractedJob.application_url,
                source: extractedJob.source,
                match_score: extractedJob.match_score,
                status: 'new',
                is_saved: false,
                is_dismissed: false,
                created_at: new Date().toISOString()
              });
            
            if (!error) {
              jobsAdded++;
              console.log(`Added job: ${extractedJob.title} at ${extractedJob.company} (${extractedJob.match_score}% match)`);
            }
          } else {
            console.log(`Duplicate job skipped: ${extractedJob.title} at ${extractedJob.company}`);
          }
        }
      }
      
      // Update last processed time
      this.setLastProcessedTime(new Date());
      
      // Update processing stats in localStorage for the monitoring dashboard
      const stats = {
        lastProcessed: new Date().toISOString(),
        emailsProcessed: emailsToProcess.length,
        jobsFound: jobsFound,
        jobsAdded: jobsAdded,
        belowThreshold: belowThreshold,
        matchThreshold: matchThreshold,
        totalProcessed: JSON.parse(localStorage.getItem('email_processing_stats') || '{}').totalProcessed || 0 + emailsToProcess.length
      };
      
      localStorage.setItem('email_processing_stats', JSON.stringify(stats));
      
      console.log(`Email processing complete: ${emailsToProcess.length} emails processed, ${jobsFound} jobs found, ${jobsAdded} jobs added (${belowThreshold} below ${matchThreshold}% threshold)`);
      
      return {
        emailsProcessed: emailsToProcess.length,
        jobsFound: jobsFound,
        jobsAdded: jobsAdded,
        belowThreshold: belowThreshold
      };
      
    } catch (error) {
      console.error('Error processing emails:', error);
      throw error;
    }
  }
  
  static getProcessingStats(): any {
    return JSON.parse(localStorage.getItem('email_processing_stats') || '{}');
  }
}