// Accessibility Audit Tool for WCAG AAA Compliance
export interface AccessibilityIssue {
  id: string;
  level: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  rule: string;
  description: string;
  element?: string;
  suggestion: string;
  contrast?: {
    foreground: string;
    background: string;
    ratio: number;
    required: number;
  };
}

export interface AccessibilityAuditResult {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  wcagCompliance: {
    A: boolean;
    AA: boolean;
    AAA: boolean;
  };
}

export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];

  // Calculate relative luminance for color contrast
  private calculateLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Convert hex to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate contrast ratio between two colors
  private calculateContrastRatio(foreground: string, background: string): number {
    const fgRgb = this.hexToRgb(foreground);
    const bgRgb = this.hexToRgb(background);
    
    if (!fgRgb || !bgRgb) return 1;

    const fgLum = this.calculateLuminance(fgRgb);
    const bgLum = this.calculateLuminance(bgRgb);

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Get computed color from element
  private getComputedColor(element: Element, property: string): string {
    const computed = window.getComputedStyle(element);
    const color = computed.getPropertyValue(property);
    
    // Convert rgb() to hex
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
      const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
      const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return color;
  }

  // Check color contrast for all text elements
  private checkColorContrast(): void {
    const textElements = document.querySelectorAll('*');
    
    textElements.forEach((element, index) => {
      const computed = window.getComputedStyle(element);
      const fontSize = parseFloat(computed.fontSize);
      const fontWeight = computed.fontWeight;
      
      // Skip elements without text content
      if (!element.textContent?.trim()) return;
      
      const foreground = this.getComputedColor(element, 'color');
      const background = this.getComputedColor(element, 'background-color');
      
      if (foreground && background && foreground !== background) {
        const ratio = this.calculateContrastRatio(foreground, background);
        
        // Determine required ratio based on text size
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const requiredAA = isLargeText ? 3 : 4.5;
        const requiredAAA = isLargeText ? 4.5 : 7;

        if (ratio < requiredAAA) {
          this.issues.push({
            id: `contrast-${index}`,
            level: ratio < requiredAA ? 'error' : 'warning',
            wcagLevel: ratio < requiredAA ? 'AA' : 'AAA',
            rule: 'WCAG 1.4.6 Contrast (Enhanced)',
            description: `Text contrast ratio is ${ratio.toFixed(2)}:1, below the ${requiredAAA}:1 requirement for AAA compliance`,
            element: element.tagName.toLowerCase(),
            suggestion: `Increase contrast between text (${foreground}) and background (${background})`,
            contrast: {
              foreground,
              background,
              ratio,
              required: requiredAAA
            }
          });
        }
      }
    });
  }

  // Check for missing alt attributes on images
  private checkImageAltText(): void {
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        this.issues.push({
          id: `img-alt-${index}`,
          level: 'error',
          wcagLevel: 'A',
          rule: 'WCAG 1.1.1 Non-text Content',
          description: 'Image missing alt attribute',
          element: `img[src="${img.src}"]`,
          suggestion: 'Add descriptive alt text or empty alt="" for decorative images'
        });
      } else if (img.alt.trim() === '' && !img.hasAttribute('aria-hidden')) {
        this.issues.push({
          id: `img-alt-empty-${index}`,
          level: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 1.1.1 Non-text Content',
          description: 'Image has empty alt text but is not marked as decorative',
          element: `img[src="${img.src}"]`,
          suggestion: 'Add aria-hidden="true" if decorative, or provide descriptive alt text'
        });
      }
    });
  }

  // Check for proper heading hierarchy
  private checkHeadingHierarchy(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        this.issues.push({
          id: `heading-start-${index}`,
          level: 'warning',
          wcagLevel: 'AA',
          rule: 'WCAG 1.3.1 Info and Relationships',
          description: 'Page should start with an h1 heading',
          element: heading.tagName.toLowerCase(),
          suggestion: 'Ensure the first heading on the page is h1'
        });
      }
      
      if (level > lastLevel + 1) {
        this.issues.push({
          id: `heading-skip-${index}`,
          level: 'warning',
          wcagLevel: 'AA',
          rule: 'WCAG 1.3.1 Info and Relationships',
          description: `Heading level skipped from h${lastLevel} to h${level}`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Use heading levels in sequence (h1, h2, h3, etc.)'
        });
      }
      
      lastLevel = level;
    });
  }

  // Check for missing form labels
  private checkFormLabels(): void {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label');
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        this.issues.push({
          id: `form-label-${index}`,
          level: 'error',
          wcagLevel: 'A',
          rule: 'WCAG 1.3.1 Info and Relationships',
          description: 'Form control missing accessible label',
          element: input.tagName.toLowerCase(),
          suggestion: 'Add a <label> element, aria-label, or aria-labelledby attribute'
        });
      }
    });
  }

  // Check for keyboard accessibility
  private checkKeyboardAccessibility(): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
    
    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.issues.push({
          id: `tabindex-positive-${index}`,
          level: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 2.4.3 Focus Order',
          description: 'Positive tabindex can disrupt natural tab order',
          element: element.tagName.toLowerCase(),
          suggestion: 'Use tabindex="0" or remove tabindex to follow natural document order'
        });
      }
      
      // Check for click handlers on non-interactive elements
      if (!['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
        const hasClickHandler = element.hasAttribute('onclick') || 
          (element as any)._listeners?.click ||
          getComputedStyle(element).cursor === 'pointer';
        
        if (hasClickHandler && !element.hasAttribute('role') && tabIndex !== '0') {
          this.issues.push({
            id: `keyboard-interactive-${index}`,
            level: 'warning',
            wcagLevel: 'A',
            rule: 'WCAG 2.1.1 Keyboard',
            description: 'Interactive element may not be keyboard accessible',
            element: element.tagName.toLowerCase(),
            suggestion: 'Add role="button" and tabindex="0", or use semantic HTML elements'
          });
        }
      }
    });
  }

  // Check for ARIA usage
  private checkAriaUsage(): void {
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
    
    elementsWithAria.forEach((element, index) => {
      const role = element.getAttribute('role');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');
      
      // Check if aria-labelledby references exist
      if (ariaLabelledBy) {
        const ids = ariaLabelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.issues.push({
              id: `aria-labelledby-missing-${index}`,
              level: 'error',
              wcagLevel: 'A',
              rule: 'WCAG 1.3.1 Info and Relationships',
              description: `aria-labelledby references non-existent element with id="${id}"`,
              element: element.tagName.toLowerCase(),
              suggestion: 'Ensure referenced element exists or remove invalid reference'
            });
          }
        });
      }
      
      // Check if aria-describedby references exist
      if (ariaDescribedBy) {
        const ids = ariaDescribedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            this.issues.push({
              id: `aria-describedby-missing-${index}`,
              level: 'error',
              wcagLevel: 'A',
              rule: 'WCAG 1.3.1 Info and Relationships',
              description: `aria-describedby references non-existent element with id="${id}"`,
              element: element.tagName.toLowerCase(),
              suggestion: 'Ensure referenced element exists or remove invalid reference'
            });
          }
        });
      }
      
      // Check for appropriate role usage
      if (role && !this.isValidRole(role)) {
        this.issues.push({
          id: `invalid-role-${index}`,
          level: 'warning',
          wcagLevel: 'A',
          rule: 'WCAG 4.1.2 Name, Role, Value',
          description: `Invalid or inappropriate ARIA role: ${role}`,
          element: element.tagName.toLowerCase(),
          suggestion: 'Use valid ARIA roles appropriate for the element'
        });
      }
    });
  }

  // Validate ARIA role
  private isValidRole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'directory', 'document',
      'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
      'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
      'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
      'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    return validRoles.includes(role);
  }

  // Run comprehensive accessibility audit
  public audit(): AccessibilityAuditResult {
    this.issues = [];
    
    // Run all checks
    this.checkColorContrast();
    this.checkImageAltText();
    this.checkHeadingHierarchy();
    this.checkFormLabels();
    this.checkKeyboardAccessibility();
    this.checkAriaUsage();

    // Calculate summary
    const summary = {
      errors: this.issues.filter(issue => issue.level === 'error').length,
      warnings: this.issues.filter(issue => issue.level === 'warning').length,
      info: this.issues.filter(issue => issue.level === 'info').length
    };

    // Calculate WCAG compliance
    const wcagCompliance = {
      A: !this.issues.some(issue => issue.level === 'error' && issue.wcagLevel === 'A'),
      AA: !this.issues.some(issue => issue.level === 'error' && ['A', 'AA'].includes(issue.wcagLevel)),
      AAA: this.issues.length === 0
    };

    // Calculate score (0-100)
    const totalElements = document.querySelectorAll('*').length;
    const score = Math.max(0, Math.min(100, 
      100 - (summary.errors * 10 + summary.warnings * 5 + summary.info * 1)
    ));

    return {
      score,
      issues: this.issues,
      summary,
      wcagCompliance
    };
  }

  // Generate detailed report
  public generateReport(result: AccessibilityAuditResult): string {
    let report = `# Accessibility Audit Report\n\n`;
    report += `**Overall Score:** ${result.score}/100\n\n`;
    report += `**WCAG Compliance:**\n`;
    report += `- Level A: ${result.wcagCompliance.A ? '✅ Pass' : '❌ Fail'}\n`;
    report += `- Level AA: ${result.wcagCompliance.AA ? '✅ Pass' : '❌ Fail'}\n`;
    report += `- Level AAA: ${result.wcagCompliance.AAA ? '✅ Pass' : '❌ Fail'}\n\n`;
    
    report += `**Issues Summary:**\n`;
    report += `- Errors: ${result.summary.errors}\n`;
    report += `- Warnings: ${result.summary.warnings}\n`;
    report += `- Info: ${result.summary.info}\n\n`;

    if (result.issues.length > 0) {
      report += `## Issues Found\n\n`;
      
      result.issues.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.rule}\n`;
        report += `**Level:** ${issue.level.toUpperCase()} (WCAG ${issue.wcagLevel})\n`;
        report += `**Description:** ${issue.description}\n`;
        if (issue.element) {
          report += `**Element:** ${issue.element}\n`;
        }
        report += `**Suggestion:** ${issue.suggestion}\n`;
        
        if (issue.contrast) {
          report += `**Contrast Details:**\n`;
          report += `- Foreground: ${issue.contrast.foreground}\n`;
          report += `- Background: ${issue.contrast.background}\n`;
          report += `- Ratio: ${issue.contrast.ratio.toFixed(2)}:1\n`;
          report += `- Required: ${issue.contrast.required}:1\n`;
        }
        
        report += `\n---\n\n`;
      });
    } else {
      report += `## ✅ No Issues Found\n\nCongratulations! Your page meets WCAG AAA accessibility standards.\n`;
    }

    return report;
  }
}

// Utility function to run quick accessibility check
export const runAccessibilityAudit = (): AccessibilityAuditResult => {
  const auditor = new AccessibilityAuditor();
  return auditor.audit();
};

// Export for use in development tools
export const generateAccessibilityReport = (): string => {
  const auditor = new AccessibilityAuditor();
  const result = auditor.audit();
  return auditor.generateReport(result);
};