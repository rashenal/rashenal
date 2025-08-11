import { describe, it, expect } from 'vitest';
import { BOARD_TEMPLATES, TEMPLATE_CATEGORIES } from '../boardTemplates';

describe('Board Templates', () => {
  it('exports BOARD_TEMPLATES correctly', () => {
    expect(BOARD_TEMPLATES).toBeDefined();
    expect(Array.isArray(BOARD_TEMPLATES)).toBe(true);
    expect(BOARD_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('exports TEMPLATE_CATEGORIES correctly', () => {
    expect(TEMPLATE_CATEGORIES).toBeDefined();
    expect(typeof TEMPLATE_CATEGORIES).toBe('object');
    expect(Object.keys(TEMPLATE_CATEGORIES).length).toBeGreaterThan(0);
  });

  it('all templates have required properties', () => {
    BOARD_TEMPLATES.forEach(template => {
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('columns');
      expect(template).toHaveProperty('default_tasks');
      
      // Validate category exists in TEMPLATE_CATEGORIES
      expect(TEMPLATE_CATEGORIES).toHaveProperty(template.category);
    });
  });

  it('template categories have required structure', () => {
    Object.entries(TEMPLATE_CATEGORIES).forEach(([key, category]) => {
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(typeof category.name).toBe('string');
      expect(typeof category.icon).toBe('string');
    });
  });

  it('all templates have valid columns', () => {
    BOARD_TEMPLATES.forEach(template => {
      expect(Array.isArray(template.columns)).toBe(true);
      expect(template.columns.length).toBeGreaterThan(0);
      
      template.columns.forEach(column => {
        expect(column).toHaveProperty('id');
        expect(column).toHaveProperty('name');
        expect(column).toHaveProperty('color');
        expect(typeof column.name).toBe('string');
        expect(column.name.length).toBeGreaterThan(0);
      });
    });
  });

  it('all templates have valid tasks', () => {
    BOARD_TEMPLATES.forEach(template => {
      expect(Array.isArray(template.default_tasks)).toBe(true);
      
      template.default_tasks.forEach(task => {
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('energy_level');
        expect(typeof task.title).toBe('string');
        expect(task.title.length).toBeGreaterThan(0);
      });
    });
  });

  it('SAVERS template exists and is properly configured', () => {
    const saversTemplate = BOARD_TEMPLATES.find(t => t.id === 'savers-morning-miracle');
    expect(saversTemplate).toBeDefined();
    expect(saversTemplate?.name).toContain('SAVERS');
    expect(saversTemplate?.category).toBe('personal');
    expect(saversTemplate?.columns.length).toBeGreaterThan(0);
    expect(saversTemplate?.default_tasks.length).toBeGreaterThan(0);
  });
});