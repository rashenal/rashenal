// CSV utilities for task import/export
import { Task } from './database-types';

export interface CSVTask {
  title: string;
  description?: string;
  status?: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  category?: string;
  // Export only fields
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CSVParseResult {
  valid: CSVTask[];
  errors: Array<{
    row: number;
    field: string;
    value: string;
    error: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface CSVExportOptions {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  priority?: string[];
  project?: string;
  includeArchived?: boolean;
}

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'done', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Parse CSV string to array of tasks
export function parseTaskCSV(csvContent: string): CSVParseResult {
  console.log('📊 Parsing CSV content, length:', csvContent.length);
  
  const result: CSVParseResult = {
    valid: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0
  };

  try {
    // Split into lines and filter empty ones
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    console.log('📋 CSV Headers:', headers);

    // Validate required headers
    if (!headers.includes('title')) {
      throw new Error('CSV must include a "title" column');
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      result.totalRows++;
      const values = parseCSVLine(line);
      const task: CSVTask = {};
      let hasErrors = false;

      // Map values to task object
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        switch (header) {
          case 'title':
            if (!value) {
              result.errors.push({
                row: i + 1,
                field: 'title',
                value: '',
                error: 'Title is required'
              });
              hasErrors = true;
            } else {
              task.title = value;
            }
            break;

          case 'description':
            task.description = value || undefined;
            break;

          case 'status':
            if (value) {
              const normalizedStatus = value.toLowerCase().replace(/\s+/g, '_');
              if (VALID_STATUSES.includes(normalizedStatus)) {
                task.status = normalizedStatus as CSVTask['status'];
              } else {
                result.errors.push({
                  row: i + 1,
                  field: 'status',
                  value,
                  error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
                });
                hasErrors = true;
              }
            }
            break;

          case 'priority':
            if (value) {
              const normalizedPriority = value.toLowerCase();
              if (VALID_PRIORITIES.includes(normalizedPriority)) {
                task.priority = normalizedPriority as CSVTask['priority'];
              } else {
                result.errors.push({
                  row: i + 1,
                  field: 'priority',
                  value,
                  error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
                });
                hasErrors = true;
              }
            }
            break;

          case 'category':
            task.category = value || undefined;
            break;

          case 'due_date':
            if (value) {
              const parsedDate = parseDate(value);
              if (parsedDate) {
                task.due_date = parsedDate.toISOString();
              } else {
                result.warnings.push({
                  row: i + 1,
                  message: `Could not parse date: ${value}. Expected format: YYYY-MM-DD or MM/DD/YYYY`
                });
              }
            }
            break;


          // Export-only fields (ignored during import)
          case 'id':
          case 'created_at':
          case 'updated_at':
            if (value) {
              result.warnings.push({
                row: i + 1,
                message: `Field "${header}" is ignored during import`
              });
            }
            break;
        }
      });

      if (!hasErrors && task.title) {
        result.valid.push(task);
        result.validRows++;
      } else {
        result.invalidRows++;
      }
    }

    console.log(`✅ CSV Parse complete: ${result.validRows} valid, ${result.invalidRows} invalid`);
    return result;

  } catch (error) {
    console.error('❌ CSV parsing error:', error);
    throw error;
  }
}

// Parse a single CSV line handling quotes and commas
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current);
  
  return values;
}

// Parse various date formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try ISO format (YYYY-MM-DD)
  let date = new Date(dateStr);
  if (!isNaN(date.getTime()) && dateStr.includes('-')) {
    return date;
  }
  
  // Try US format (MM/DD/YYYY)
  const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const usMatch = dateStr.match(usFormat);
  if (usMatch) {
    date = new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try other common formats
  date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

// Generate CSV content from tasks
export function generateTaskCSV(tasks: Task[], options?: CSVExportOptions): string {
  console.log(`📊 Generating CSV for ${tasks.length} tasks`);
  
  // Apply filters if provided
  let filteredTasks = tasks;
  
  if (options?.status && options.status.length > 0) {
    filteredTasks = filteredTasks.filter(task => 
      options.status!.includes(task.status)
    );
  }
  
  if (options?.priority && options.priority.length > 0) {
    filteredTasks = filteredTasks.filter(task => 
      options.priority!.includes(task.priority)
    );
  }
  
  if (options?.dateFrom) {
    filteredTasks = filteredTasks.filter(task => 
      new Date(task.created_at) >= options.dateFrom!
    );
  }
  
  if (options?.dateTo) {
    filteredTasks = filteredTasks.filter(task => 
      new Date(task.created_at) <= options.dateTo!
    );
  }
  
  console.log(`📊 Filtered to ${filteredTasks.length} tasks for export`);
  
  // CSV headers
  const headers = [
    'id',
    'title',
    'description',
    'status',
    'priority',
    'category',
    'due_date',
    'created_at',
    'updated_at'
  ];
  
  // Add metadata row
  const metadata = `# Rashenal Tasks Export - Generated: ${new Date().toISOString()} - Count: ${filteredTasks.length}`;
  
  // Build CSV content
  const csvLines = [
    metadata,
    headers.join(','),
    ...filteredTasks.map(task => {
      const values = [
        escapeCSVValue(task.id),
        escapeCSVValue(task.title),
        escapeCSVValue(task.description || ''),
        escapeCSVValue(task.status),
        escapeCSVValue(task.priority),
        escapeCSVValue(task.category || ''),
        escapeCSVValue(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''),
        escapeCSVValue(new Date(task.created_at).toISOString()),
        escapeCSVValue(new Date(task.updated_at).toISOString())
      ];
      return values.join(',');
    })
  ];
  
  return csvLines.join('\n');
}

// Escape CSV values that contain commas, quotes, or newlines
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

// Generate filename for export
export function generateExportFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `rashenal_tasks_${year}-${month}-${day}_${hour}-${minute}.csv`;
}

// Download CSV file
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  console.log(`✅ Downloaded CSV: ${filename}`);
}

// Check for duplicate tasks
export function findDuplicateTasks(
  importTasks: CSVTask[], 
  existingTasks: Task[]
): Map<number, Task[]> {
  const duplicates = new Map<number, Task[]>();
  
  importTasks.forEach((importTask, index) => {
    const matches = existingTasks.filter(existing => 
      existing.title.toLowerCase() === importTask.title.toLowerCase() &&
      existing.status === (importTask.status || 'todo')
    );
    
    if (matches.length > 0) {
      duplicates.set(index, matches);
    }
  });
  
  return duplicates;
}