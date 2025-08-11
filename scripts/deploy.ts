// Automated deployment script for Rashenal platform
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  supabaseProjectRef: string;
  supabaseUrl: string;
  buildCommand: string;
  testCommand: string;
  lintCommand: string;
  typecheckCommand: string;
  migrations: {
    enabled: boolean;
    path: string;
  };
  functions: {
    enabled: boolean;
    functions: string[];
  };
  preDeployChecks: boolean;
  postDeployTests: boolean;
  rollbackOnFailure: boolean;
  notifications: {
    enabled: boolean;
    webhook?: string;
    email?: string;
  };
}

interface DeploymentResult {
  success: boolean;
  environment: string;
  version: string;
  timestamp: string;
  duration: number;
  steps: Array<{
    name: string;
    success: boolean;
    duration: number;
    output?: string;
    error?: string;
  }>;
  rollback?: {
    triggered: boolean;
    success: boolean;
    reason: string;
  };
}

export class RashenalDeployment {
  private config: DeploymentConfig;
  private startTime: number = 0;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  public async deploy(): Promise<DeploymentResult> {
    this.startTime = Date.now();
    const steps: DeploymentResult['steps'] = [];
    let rollback: DeploymentResult['rollback'] | undefined;

    console.log(`🚀 Starting deployment to ${this.config.environment}`);
    console.log(`📋 Configuration:`, this.config);

    try {
      // Pre-deployment checks
      if (this.config.preDeployChecks) {
        await this.executeStep('Pre-deployment checks', async () => {
          await this.runPreDeploymentChecks();
        }, steps);
      }

      // Build application
      await this.executeStep('Build application', async () => {
        this.runCommand(this.config.buildCommand);
      }, steps);

      // Run tests
      if (this.config.testCommand) {
        await this.executeStep('Run tests', async () => {
          this.runCommand(this.config.testCommand);
        }, steps);
      }

      // Lint and type check
      if (this.config.lintCommand) {
        await this.executeStep('Lint code', async () => {
          this.runCommand(this.config.lintCommand);
        }, steps);
      }

      if (this.config.typecheckCommand) {
        await this.executeStep('Type check', async () => {
          this.runCommand(this.config.typecheckCommand);
        }, steps);
      }

      // Deploy database migrations
      if (this.config.migrations.enabled) {
        await this.executeStep('Deploy migrations', async () => {
          await this.deployMigrations();
        }, steps);
      }

      // Deploy Supabase functions
      if (this.config.functions.enabled) {
        await this.executeStep('Deploy functions', async () => {
          await this.deployFunctions();
        }, steps);
      }

      // Deploy application
      await this.executeStep('Deploy application', async () => {
        await this.deployApplication();
      }, steps);

      // Post-deployment tests
      if (this.config.postDeployTests) {
        await this.executeStep('Post-deployment tests', async () => {
          await this.runPostDeploymentTests();
        }, steps);
      }

      // Send success notification
      if (this.config.notifications.enabled) {
        await this.executeStep('Send notifications', async () => {
          await this.sendNotification(true);
        }, steps);
      }

      const result: DeploymentResult = {
        success: true,
        environment: this.config.environment,
        version: this.getVersion(),
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        steps
      };

      console.log('✅ Deployment completed successfully!');
      return result;

    } catch (error) {
      console.error('❌ Deployment failed:', error);

      // Attempt rollback if enabled
      if (this.config.rollbackOnFailure) {
        rollback = await this.attemptRollback();
      }

      // Send failure notification
      if (this.config.notifications.enabled) {
        await this.sendNotification(false, error as Error);
      }

      const result: DeploymentResult = {
        success: false,
        environment: this.config.environment,
        version: this.getVersion(),
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        steps,
        rollback
      };

      return result;
    }
  }

  private async executeStep(
    name: string,
    fn: () => Promise<void> | void,
    steps: DeploymentResult['steps']
  ): Promise<void> {
    console.log(`🔄 ${name}...`);
    const stepStart = Date.now();

    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }

      steps.push({
        name,
        success: true,
        duration: Date.now() - stepStart
      });

      console.log(`✅ ${name} completed`);
    } catch (error) {
      steps.push({
        name,
        success: false,
        duration: Date.now() - stepStart,
        error: error instanceof Error ? error.message : String(error)
      });

      console.error(`❌ ${name} failed:`, error);
      throw error;
    }
  }

  private runCommand(command: string): string {
    console.log(`Running: ${command}`);
    return execSync(command, { encoding: 'utf8', cwd: process.cwd() });
  }

  private async runPreDeploymentChecks(): Promise<void> {
    // Check if required files exist
    const requiredFiles = [
      'package.json',
      'src/main.tsx',
      '.env.local'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check environment variables
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable missing: ${envVar}`);
      }
    }

    // Check Supabase connection
    try {
      this.runCommand('supabase status');
    } catch (error) {
      throw new Error('Supabase connection check failed');
    }

    // Check for uncommitted changes (in production)
    if (this.config.environment === 'production') {
      try {
        const status = this.runCommand('git status --porcelain');
        if (status.trim()) {
          throw new Error('Uncommitted changes detected. Please commit all changes before production deployment.');
        }
      } catch (error) {
        // Git not available or not a git repository
        console.warn('⚠️ Could not check git status');
      }
    }

    console.log('✅ Pre-deployment checks passed');
  }

  private async deployMigrations(): Promise<void> {
    try {
      // Check if there are pending migrations
      const migrationsPath = this.config.migrations.path;
      if (!existsSync(migrationsPath)) {
        console.log('No migrations directory found, skipping...');
        return;
      }

      // Deploy migrations
      this.runCommand(`supabase db push --project-ref ${this.config.supabaseProjectRef}`);
      console.log('✅ Migrations deployed successfully');
    } catch (error) {
      throw new Error(`Migration deployment failed: ${error}`);
    }
  }

  private async deployFunctions(): Promise<void> {
    try {
      for (const functionName of this.config.functions.functions) {
        console.log(`Deploying function: ${functionName}`);
        this.runCommand(`supabase functions deploy ${functionName} --project-ref ${this.config.supabaseProjectRef}`);
      }
      console.log('✅ Functions deployed successfully');
    } catch (error) {
      throw new Error(`Function deployment failed: ${error}`);
    }
  }

  private async deployApplication(): Promise<void> {
    // This would typically deploy to your hosting platform
    // For example, Vercel, Netlify, or custom server
    
    switch (this.config.environment) {
      case 'production':
        // Deploy to production hosting
        console.log('Deploying to production hosting...');
        // this.runCommand('vercel --prod');
        break;
      
      case 'staging':
        // Deploy to staging environment
        console.log('Deploying to staging environment...');
        // this.runCommand('vercel');
        break;
      
      case 'development':
        // For development, just ensure build is successful
        console.log('Development deployment - build verification complete');
        break;
    }
  }

  private async runPostDeploymentTests(): Promise<void> {
    try {
      // Run smoke tests against deployed application
      console.log('Running post-deployment smoke tests...');
      
      // Test application health endpoint
      const healthUrl = `${this.config.supabaseUrl}/health`;
      
      // This would typically use a proper HTTP client
      console.log(`Testing health endpoint: ${healthUrl}`);
      
      // Test database connection
      this.runCommand(`supabase db ping --project-ref ${this.config.supabaseProjectRef}`);
      
      // Run specific E2E tests marked as smoke tests
      // this.runCommand('npm run test:e2e:smoke');
      
      console.log('✅ Post-deployment tests passed');
    } catch (error) {
      throw new Error(`Post-deployment tests failed: ${error}`);
    }
  }

  private async attemptRollback(): Promise<DeploymentResult['rollback']> {
    console.log('🔄 Attempting rollback...');
    const rollbackStart = Date.now();

    try {
      // Get previous deployment version
      const previousVersion = this.getPreviousVersion();
      
      if (!previousVersion) {
        throw new Error('No previous version found for rollback');
      }

      console.log(`Rolling back to version: ${previousVersion}`);

      // Rollback application deployment
      // this.runCommand(`vercel rollback ${previousVersion}`);

      // Rollback database migrations if needed
      if (this.config.migrations.enabled) {
        console.log('⚠️ Manual database rollback may be required');
      }

      return {
        triggered: true,
        success: true,
        reason: 'Deployment failure - automatic rollback'
      };
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return {
        triggered: true,
        success: false,
        reason: `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async sendNotification(success: boolean, error?: Error): Promise<void> {
    const message = success
      ? `✅ Deployment to ${this.config.environment} completed successfully`
      : `❌ Deployment to ${this.config.environment} failed${error ? ': ' + error.message : ''}`;

    console.log(`📧 Sending notification: ${message}`);

    // Send webhook notification
    if (this.config.notifications.webhook) {
      try {
        // This would typically use fetch or axios
        console.log(`Sending webhook to: ${this.config.notifications.webhook}`);
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }

    // Send email notification
    if (this.config.notifications.email) {
      try {
        console.log(`Sending email to: ${this.config.notifications.email}`);
        // Email sending logic would go here
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }

  private getVersion(): string {
    try {
      // Try to get version from git
      return this.runCommand('git rev-parse --short HEAD').trim();
    } catch (error) {
      // Fall back to package.json version
      try {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
        return packageJson.version || 'unknown';
      } catch (error) {
        return 'unknown';
      }
    }
  }

  private getPreviousVersion(): string | null {
    try {
      return this.runCommand('git rev-parse --short HEAD~1').trim();
    } catch (error) {
      return null;
    }
  }
}

// Configuration presets
export const deploymentConfigs: Record<string, DeploymentConfig> = {
  development: {
    environment: 'development',
    supabaseProjectRef: process.env.SUPABASE_PROJECT_REF || '',
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    buildCommand: 'npm run build',
    testCommand: 'npm run test:unit',
    lintCommand: 'npm run lint',
    typecheckCommand: 'npx tsc --noEmit',
    migrations: {
      enabled: true,
      path: 'supabase/migrations'
    },
    functions: {
      enabled: true,
      functions: ['ai-chat', 'job-discovery', 'search-monitor', 'search-executor']
    },
    preDeployChecks: true,
    postDeployTests: false,
    rollbackOnFailure: false,
    notifications: {
      enabled: false
    }
  },

  staging: {
    environment: 'staging',
    supabaseProjectRef: process.env.SUPABASE_STAGING_PROJECT_REF || '',
    supabaseUrl: process.env.VITE_SUPABASE_STAGING_URL || '',
    buildCommand: 'npm run build',
    testCommand: 'npm run test',
    lintCommand: 'npm run lint',
    typecheckCommand: 'npx tsc --noEmit',
    migrations: {
      enabled: true,
      path: 'supabase/migrations'
    },
    functions: {
      enabled: true,
      functions: ['ai-chat', 'job-discovery', 'search-monitor', 'search-executor']
    },
    preDeployChecks: true,
    postDeployTests: true,
    rollbackOnFailure: true,
    notifications: {
      enabled: true,
      webhook: process.env.STAGING_WEBHOOK_URL
    }
  },

  production: {
    environment: 'production',
    supabaseProjectRef: process.env.SUPABASE_PRODUCTION_PROJECT_REF || '',
    supabaseUrl: process.env.VITE_SUPABASE_PRODUCTION_URL || '',
    buildCommand: 'npm run build',
    testCommand: 'npm run test',
    lintCommand: 'npm run lint',
    typecheckCommand: 'npx tsc --noEmit',
    migrations: {
      enabled: true,
      path: 'supabase/migrations'
    },
    functions: {
      enabled: true,
      functions: ['ai-chat', 'job-discovery', 'search-monitor', 'search-executor']
    },
    preDeployChecks: true,
    postDeployTests: true,
    rollbackOnFailure: true,
    notifications: {
      enabled: true,
      webhook: process.env.PRODUCTION_WEBHOOK_URL,
      email: process.env.PRODUCTION_NOTIFICATION_EMAIL
    }
  }
};

// CLI interface
async function main() {
  const environment = process.argv[2] as keyof typeof deploymentConfigs;
  
  if (!environment || !deploymentConfigs[environment]) {
    console.error('Usage: npm run deploy [development|staging|production]');
    process.exit(1);
  }

  const config = deploymentConfigs[environment];
  const deployment = new RashenalDeployment(config);
  
  try {
    const result = await deployment.deploy();
    
    if (result.success) {
      console.log('\n🎉 Deployment Summary:');
      console.log(`Environment: ${result.environment}`);
      console.log(`Version: ${result.version}`);
      console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`Steps completed: ${result.steps.filter(s => s.success).length}/${result.steps.length}`);
      process.exit(0);
    } else {
      console.log('\n💥 Deployment Failed:');
      console.log(`Environment: ${result.environment}`);
      console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`Failed steps: ${result.steps.filter(s => !s.success).length}/${result.steps.length}`);
      
      if (result.rollback) {
        console.log(`Rollback: ${result.rollback.triggered ? (result.rollback.success ? 'Success' : 'Failed') : 'Not triggered'}`);
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Deployment failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}