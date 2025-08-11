import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  FileWarning,
  RotateCcw,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { TaskService } from '../lib/task-service';
import { Task } from '../lib/database-types';
import {
  parseTaskCSV,
  generateTaskCSV,
  generateExportFilename,
  downloadCSV,
  findDuplicateTasks,
  CSVTask,
  CSVParseResult,
  CSVExportOptions
} from '../lib/csv-utils';

interface TaskImportExportProps {
  onTasksImported?: () => void;
  onClose?: () => void;
}

type ImportStage = 'upload' | 'preview' | 'importing' | 'complete';
type DuplicateAction = 'skip' | 'update' | 'create';

interface ImportPreview {
  tasks: CSVTask[];
  parseResult: CSVParseResult;
  duplicates: Map<number, Task[]>;
  duplicateActions: Map<number, DuplicateAction>;
}

export default function TaskImportExport({ onTasksImported, onClose }: TaskImportExportProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import state
  const [importStage, setImportStage] = useState<ImportStage>('upload');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<CSVExportOptions>({
    status: [],
    priority: [],
    includeArchived: false
  });
  
  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSafetyBackup, setShowSafetyBackup] = useState(false);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('📁 File upload started:', file.name, file.type, file.size);
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      const text = await file.text();
      const parseResult = parseTaskCSV(text);
      
      if (parseResult.valid.length === 0) {
        setError('No valid tasks found in CSV file');
        return;
      }
      
      // Check for duplicates
      const existingTasks = await TaskService.getTasks();
      const duplicates = findDuplicateTasks(parseResult.valid, existingTasks);
      
      // Set default duplicate actions
      const duplicateActions = new Map<number, DuplicateAction>();
      duplicates.forEach((_, index) => {
        duplicateActions.set(index, 'skip');
      });
      
      setImportPreview({
        tasks: parseResult.valid,
        parseResult,
        duplicates,
        duplicateActions
      });
      
      setImportStage('preview');
      
      // Show safety backup reminder if there are existing tasks
      if (existingTasks.length > 0) {
        setShowSafetyBackup(true);
      }
      
    } catch (err) {
      console.error('❌ Error reading CSV file:', err);
      setError('Failed to read CSV file. Please check the format.');
    }
  }, []);
  
  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);
  
  // Handle duplicate action change
  const handleDuplicateAction = (index: number, action: DuplicateAction) => {
    if (!importPreview) return;
    
    const newActions = new Map(importPreview.duplicateActions);
    newActions.set(index, action);
    
    setImportPreview({
      ...importPreview,
      duplicateActions: newActions
    });
  };
  
  // Import tasks
  const handleImport = async () => {
    if (!importPreview || !user) return;
    
    setImporting(true);
    setImportProgress(0);
    setError(null);
    setImportStage('importing');
    
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
    
    try {
      const totalTasks = importPreview.tasks.length;
      
      for (let i = 0; i < totalTasks; i++) {
        const task = importPreview.tasks[i];
        const isDuplicate = importPreview.duplicates.has(i);
        const action = importPreview.duplicateActions.get(i) || 'skip';
        
        try {
          if (isDuplicate && action === 'skip') {
            results.skipped++;
            console.log(`⏭️ Skipping duplicate task: ${task.title}`);
          } else if (isDuplicate && action === 'update') {
            const existing = importPreview.duplicates.get(i)![0];
            await TaskService.updateTask(existing.id, {
              description: task.description || existing.description,
              priority: task.priority || existing.priority,
              category: task.category || existing.category,
              due_date: task.due_date || existing.due_date
            });
            results.updated++;
            console.log(`✏️ Updated task: ${task.title}`);
          } else {
            // Create new task
            await TaskService.createTask({
              title: task.title,
              description: task.description || '',
              status: task.status || 'todo',
              priority: task.priority || 'medium',
              category: task.category || null,
              due_date: task.due_date || null
            });
            results.created++;
            console.log(`✅ Created task: ${task.title}`);
          }
        } catch (err) {
          console.error(`❌ Error processing task ${i + 1}:`, err);
          results.errors++;
        }
        
        setImportProgress(Math.round(((i + 1) / totalTasks) * 100));
      }
      
      setImportResults(results);
      setImportStage('complete');
      setSuccess(`Import complete! Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}`);
      
      // Notify parent component
      if (onTasksImported) {
        onTasksImported();
      }
      
    } catch (err) {
      console.error('❌ Import failed:', err);
      setError('Import failed. Please try again.');
      setImportStage('preview');
    } finally {
      setImporting(false);
    }
  };
  
  // Export tasks
  const handleExport = async () => {
    if (!user) return;
    
    setExporting(true);
    setError(null);
    
    try {
      // Create safety backup first
      console.log('📦 Creating safety backup before export...');
      
      const tasks = await TaskService.getTasks();
      const csvContent = generateTaskCSV(tasks, exportOptions);
      const filename = generateExportFilename();
      
      downloadCSV(csvContent, filename);
      setSuccess(`Exported ${tasks.length} tasks to ${filename}`);
      
    } catch (err) {
      console.error('❌ Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setShowExportOptions(false);
    }
  };
  
  // Reset import
  const resetImport = () => {
    setImportStage('upload');
    setImportPreview(null);
    setImportResults(null);
    setImportProgress(0);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-primary rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <FileText className="h-6 w-6 text-purple-600 mr-2" />
          Task Import/Export
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Safety Backup Notice */}
      {showSafetyBackup && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Safety Reminder: Create a backup first!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You have existing tasks. We recommend exporting a backup before importing new tasks.
              </p>
              <button
                onClick={() => {
                  setShowSafetyBackup(false);
                  setShowExportOptions(true);
                }}
                className="mt-2 text-xs font-medium text-yellow-700 dark:text-yellow-300 underline hover:no-underline"
              >
                Export backup now →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}
      
      {/* Import/Export Tabs */}
      <div className="grid grid-cols-2 gap-4">
        {/* Import Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Tasks
          </h3>
          
          {importStage === 'upload' && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-primary font-medium mb-2">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="text-sm text-secondary">
                    Maximum file size: 5MB
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                  <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-2">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Required column: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">title</code></li>
                      <li>Optional columns: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">description</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">status</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">priority</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">category</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">due_date</code></li>
                      <li>Status values: backlog, todo, in_progress, blocked, done, completed</li>
                      <li>Priority values: low, medium, high, urgent</li>
                      <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {importStage === 'preview' && importPreview && (
            <div className="space-y-4">
              {/* Parse Results Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">Import Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary">Total rows:</span>
                    <span className="ml-2 font-medium text-primary">{importPreview.parseResult.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-secondary">Valid tasks:</span>
                    <span className="ml-2 font-medium text-green-600">{importPreview.parseResult.validRows}</span>
                  </div>
                  <div>
                    <span className="text-secondary">Invalid rows:</span>
                    <span className="ml-2 font-medium text-red-600">{importPreview.parseResult.invalidRows}</span>
                  </div>
                  <div>
                    <span className="text-secondary">Duplicates:</span>
                    <span className="ml-2 font-medium text-yellow-600">{importPreview.duplicates.size}</span>
                  </div>
                </div>
              </div>
              
              {/* Errors */}
              {importPreview.parseResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                    Validation Errors ({importPreview.parseResult.errors.length})
                  </h4>
                  <div className="space-y-1">
                    {importPreview.parseResult.errors.slice(0, 5).map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                        Row {error.row}: {error.field} - {error.error}
                      </p>
                    ))}
                    {importPreview.parseResult.errors.length > 5 && (
                      <p className="text-xs text-red-600 dark:text-red-400 italic">
                        ...and {importPreview.parseResult.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Warnings */}
              {importPreview.parseResult.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                    Warnings ({importPreview.parseResult.warnings.length})
                  </h4>
                  <div className="space-y-1">
                    {importPreview.parseResult.warnings.slice(0, 5).map((warning, idx) => (
                      <p key={idx} className="text-xs text-yellow-600 dark:text-yellow-400">
                        Row {warning.row}: {warning.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Duplicate Handling */}
              {importPreview.duplicates.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Duplicate Tasks ({importPreview.duplicates.size})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.from(importPreview.duplicates.entries()).slice(0, 5).map(([index, matches]) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                          {importPreview.tasks[index].title}
                        </span>
                        <select
                          value={importPreview.duplicateActions.get(index) || 'skip'}
                          onChange={(e) => handleDuplicateAction(index, e.target.value as DuplicateAction)}
                          className="ml-2 px-2 py-1 border border-secondary bg-primary text-primary rounded text-xs"
                        >
                          <option value="skip">Skip</option>
                          <option value="update">Update</option>
                          <option value="create">Create New</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-secondary">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importPreview.parseResult.validRows === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                    disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Import {importPreview.parseResult.validRows} Tasks
                </button>
              </div>
            </div>
          )}
          
          {importStage === 'importing' && (
            <div className="text-center py-8">
              <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-primary font-medium mb-2">Importing tasks...</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary">{importProgress}% complete</p>
            </div>
          )}
          
          {importStage === 'complete' && importResults && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-primary font-medium mb-4">Import Complete!</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 inline-block">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <span className="text-secondary">Created:</span>
                    <span className="ml-2 font-medium text-green-600">{importResults.created}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-secondary">Updated:</span>
                    <span className="ml-2 font-medium text-blue-600">{importResults.updated}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-secondary">Skipped:</span>
                    <span className="ml-2 font-medium text-yellow-600">{importResults.skipped}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-secondary">Errors:</span>
                    <span className="ml-2 font-medium text-red-600">{importResults.errors}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Import More Tasks
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Export Section */}
        <div className="space-y-4 border-l border-secondary pl-4">
          <h3 className="text-lg font-semibold text-primary flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Tasks
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-secondary mb-4">
              Export your tasks to CSV for backup or external processing.
            </p>
            
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="w-full flex items-center justify-between px-4 py-2 bg-primary border border-secondary 
                rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="flex items-center text-sm font-medium text-primary">
                <Filter className="h-4 w-4 mr-2" />
                Export Options
              </span>
              {showExportOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showExportOptions && (
              <div className="mt-4 space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">
                    Status Filter
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['backlog', 'todo', 'in_progress', 'blocked', 'done'].map(status => (
                      <label key={status} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={exportOptions.status?.includes(status) || false}
                          onChange={(e) => {
                            const newStatuses = e.target.checked
                              ? [...(exportOptions.status || []), status]
                              : exportOptions.status?.filter(s => s !== status) || [];
                            setExportOptions({ ...exportOptions, status: newStatuses });
                          }}
                          className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-1"
                        />
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">
                    Priority Filter
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['low', 'medium', 'high', 'urgent'].map(priority => (
                      <label key={priority} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={exportOptions.priority?.includes(priority) || false}
                          onChange={(e) => {
                            const newPriorities = e.target.checked
                              ? [...(exportOptions.priority || []), priority]
                              : exportOptions.priority?.filter(p => p !== priority) || [];
                            setExportOptions({ ...exportOptions, priority: newPriorities });
                          }}
                          className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-1"
                        />
                        <span className="capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={exportOptions.dateFrom ? exportOptions.dateFrom.toISOString().split('T')[0] : ''}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        dateFrom: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="w-full px-2 py-1 border border-secondary bg-primary text-primary rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={exportOptions.dateTo ? exportOptions.dateTo.toISOString().split('T')[0] : ''}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        dateTo: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="w-full px-2 py-1 border border-secondary bg-primary text-primary rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white 
                rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tasks to CSV
                </>
              )}
            </button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Export includes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>All task details and metadata</li>
                  <li>Creation and update timestamps</li>
                  <li>Compatible format for reimport</li>
                  <li>UTF-8 encoding for special characters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}