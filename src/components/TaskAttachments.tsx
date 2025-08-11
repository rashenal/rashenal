import React, { useState, useRef } from 'react';
import {
  Paperclip,
  Upload,
  File,
  Image,
  FileText,
  Download,
  Trash2,
  X,
  Plus,
  Loader
} from 'lucide-react';
import { EnhancedTaskService, type TaskAttachment } from '../lib/enhanced-task-service';

interface TaskAttachmentsProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentsUpdate: (attachments: TaskAttachment[]) => void;
  readonly?: boolean;
}

export default function TaskAttachments({ 
  taskId, 
  attachments, 
  onAttachmentsUpdate, 
  readonly = false 
}: TaskAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image size={16} className="text-green-600" />;
    }
    if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText size={16} className="text-red-600" />;
    }
    return <File size={16} className="text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || readonly) return;

    setIsUploading(true);
    const newAttachments = [...attachments];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        const result = await EnhancedTaskService.uploadAttachment(taskId, file);
        
        if (result.error) {
          alert(`Failed to upload ${file.name}: ${result.error.message}`);
          continue;
        }

        if (result.data) {
          newAttachments.push(result.data);
        }
      }

      onAttachmentsUpdate(newAttachments);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (attachmentId: string) => {
    if (readonly) return;

    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      const result = await EnhancedTaskService.deleteAttachment(attachmentId);
      
      if (result.error) {
        alert(`Failed to delete attachment: ${result.error.message}`);
        return;
      }

      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      onAttachmentsUpdate(updatedAttachments);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readonly) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!readonly) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDownload = (attachment: TaskAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Paperclip size={14} />
            Attachments ({attachments.length})
          </h4>
          
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.file_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  
                  {!readonly && (
                    <button
                      onClick={() => handleFileDelete(attachment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!readonly && (
        <div className="space-y-2">
          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="text-center">
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Upload size={16} className="text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-gray-400">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
}