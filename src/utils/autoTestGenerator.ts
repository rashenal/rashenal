import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

interface ComponentInfo {
  name: string;
  props: string[];
  exports: string[];
  imports: string[];
  hasState: boolean;
  hasEffects: boolean;
}

export class AutoTestGenerator {
  private srcPath: string;
  private testPath: string;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(srcPath: string = './src', testPath: string = './src/__tests__') {
    this.srcPath = srcPath;
    this.testPath = testPath;
  }

  /**
   * Start watching for file changes
   */
  startWatching() {
    console.log('🔍 Starting auto-test generator...');
    
    this.watcher = chokidar.watch(`${this.srcPath}/**/*.{tsx,ts}`, {
      ignored: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/dist/**'
      ],
      persistent: true
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('ready', () => console.log('✅ Auto-test generator is ready'));

    return this.watcher;
  }

  /**
   * Stop watching for file changes
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('🔄 Auto-test generator stopped');
    }
  }

  /**
   * Handle file changes
   */
  private async handleFileChange(filePath: string, action: 'added' | 'changed') {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${action}: ${relativePath}`);

    // Only process component files
    if (!this.isComponentFile(filePath)) {
      return;
    }

    const testFilePath = this.getTestFilePath(filePath);
    const testExists = fs.existsSync(testFilePath);

    if (!testExists) {
      console.log(`🧪 Creating new test file: ${testFilePath}`);
      await this.generateTestFile(filePath);
    } else if (action === 'changed') {
      console.log(`🔄 Updating existing test file: ${testFilePath}`);
      await this.updateTestFile(filePath, testFilePath);
    }
  }

  /**
   * Check if file is a React component
   */
  private isComponentFile(filePath: string): boolean {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('export default function') ||
        content.includes('export default') ||
        content.includes('export function') ||
        content.includes('export const') && (
          content.includes('React') ||
          content.includes('jsx') ||
          content.includes('tsx')
        )
      );
    } catch {
      return false;
    }
  }

  /**
   * Get the corresponding test file path
   */
  private getTestFilePath(filePath: string): string {
    const relativePath = path.relative(this.srcPath, filePath);
    const parsedPath = path.parse(relativePath);
    const testFileName = `${parsedPath.name}.test${parsedPath.ext}`;
    return path.join(this.testPath, parsedPath.dir, testFileName);
  }

  /**
   * Analyze component file to extract info
   */
  private analyzeComponent(filePath: string): ComponentInfo {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));

    return {
      name: fileName,
      props: this.extractProps(content),
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      hasState: content.includes('useState') || content.includes('useReducer'),
      hasEffects: content.includes('useEffect') || content.includes('useLayoutEffect')
    };
  }

  /**
   * Extract props from component
   */
  private extractProps(content: string): string[] {
    const props: string[] = [];
    
    // Look for interface definitions
    const interfaceMatches = content.match(/interface\s+\w+Props\s*{([^}]*)}/g);
    if (interfaceMatches) {
      interfaceMatches.forEach(match => {
        const propMatches = match.match(/(\w+)(\?)?:/g);
        if (propMatches) {
          props.push(...propMatches.map(prop => prop.replace(/[?:]/g, '')));
        }
      });
    }

    // Look for destructured props
    const destructureMatches = content.match(/{\s*([^}]+)\s*}.*:.*Props/g);
    if (destructureMatches) {
      destructureMatches.forEach(match => {
        const propNames = match.match(/(\w+)/g);
        if (propNames) {
          props.push(...propNames.slice(1)); // Skip first match which is likely '{'
        }
      });
    }

    return [...new Set(props)];
  }

  /**
   * Extract exports from component
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|const|interface|type|class)\s+(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const name = match.match(/(\w+)$/)?.[1];
        if (name) exports.push(name);
      });
    }

    return exports;
  }

  /**
   * Extract imports from component
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const module = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (module) imports.push(module);
      });
    }

    return imports;
  }

  /**
   * Generate a new test file
   */
  private async generateTestFile(filePath: string): Promise<void> {
    const componentInfo = this.analyzeComponent(filePath);
    const testFilePath = this.getTestFilePath(filePath);
    const testDir = path.dirname(testFilePath);

    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testContent = this.generateTestContent(componentInfo, filePath);
    fs.writeFileSync(testFilePath, testContent, 'utf8');
  }

  /**
   * Update existing test file
   */
  private async updateTestFile(filePath: string, testFilePath: string): Promise<void> {
    const componentInfo = this.analyzeComponent(filePath);
    const existingContent = fs.readFileSync(testFilePath, 'utf8');
    
    // Add TODO comments for new props or functionality
    let updatedContent = existingContent;
    
    componentInfo.props.forEach(prop => {
      if (!existingContent.includes(prop)) {
        const todoComment = `// TODO: Add test for prop '${prop}'\n`;
        if (!existingContent.includes(todoComment)) {
          updatedContent = todoComment + updatedContent;
        }
      }
    });

    if (componentInfo.hasState && !existingContent.includes('state')) {
      const todoComment = `// TODO: Add tests for state management\n`;
      if (!existingContent.includes(todoComment)) {
        updatedContent = todoComment + updatedContent;
      }
    }

    if (componentInfo.hasEffects && !existingContent.includes('effect')) {
      const todoComment = `// TODO: Add tests for useEffect hooks\n`;
      if (!existingContent.includes(todoComment)) {
        updatedContent = todoComment + updatedContent;
      }
    }

    if (updatedContent !== existingContent) {
      fs.writeFileSync(testFilePath, updatedContent, 'utf8');
    }
  }

  /**
   * Generate test file content
   */
  private generateTestContent(info: ComponentInfo, originalFilePath: string): string {
    const relativePath = path.relative(
      path.dirname(this.getTestFilePath(originalFilePath)),
      originalFilePath.replace(path.extname(originalFilePath), '')
    ).replace(/\\/g, '/');

    return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@tests/helpers/test-utils';
import ${info.name} from '${relativePath}';

// TODO: Import any required props or mock data
// import { mock${info.name}Props } from '@tests/helpers/mock-data';

describe('${info.name}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<${info.name} />);
    // TODO: Add specific assertions for component rendering
  });

  it('displays correct content', () => {
    render(<${info.name} />);
    // TODO: Test that component displays expected content
    // expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

${info.props.length > 0 ? `
  describe('Props', () => {
${info.props.map(prop => `    it('handles ${prop} prop correctly', () => {
      // TODO: Test ${prop} prop behavior
      // render(<${info.name} ${prop}={mockValue} />);
      // Add assertions here
    });`).join('\n\n')}
  });
` : ''}

${info.hasState ? `
  describe('State Management', () => {
    it('manages state correctly', () => {
      // TODO: Test state changes and updates
      render(<${info.name} />);
      // Add state testing logic here
    });
  });
` : ''}

${info.hasEffects ? `
  describe('Effects', () => {
    it('handles side effects correctly', () => {
      // TODO: Test useEffect hooks and side effects
      render(<${info.name} />);
      // Add effect testing logic here
    });
  });
` : ''}

  describe('User Interactions', () => {
    it('handles user interactions correctly', () => {
      // TODO: Test click events, form submissions, etc.
      render(<${info.name} />);
      // Add interaction testing logic here
    });
  });

  describe('Edge Cases', () => {
    it('handles edge cases gracefully', () => {
      // TODO: Test error states, empty data, loading states
      render(<${info.name} />);
      // Add edge case testing logic here
    });
  });

  // TODO: Add integration tests if component interacts with external services
  // TODO: Add accessibility tests
  // TODO: Add performance tests if needed
});
`;
  }
}

// Export singleton instance
export const autoTestGenerator = new AutoTestGenerator();

// Start watching if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoTestGenerator.startWatching();
}