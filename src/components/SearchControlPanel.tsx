import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  MoreHorizontal,
  Save,
  X,
  Shield,
  AlertTriangle,
  Check
} from 'lucide-react';
import { EnhancedJobSearch } from '../lib/database-types';

interface SearchControlPanelProps {
  search: EnhancedJobSearch;
  isRunning: boolean;
  onPause: (searchId: string) => void;
  onResume: (searchId: string) => void;
  onStop: (searchId: string) => void;
  onRename: (searchId: string, newName: string) => void;
  onDelete: (searchId: string) => void;
  onLock: (searchId: string, code: string) => void;
  onUnlock: (searchId: string, code: string) => void;
  className?: string;
}

export default function SearchControlPanel({
  search,
  isRunning,
  onPause,
  onResume,
  onStop,
  onRename,
  onDelete,
  onLock,
  onUnlock,
  className = ''
}: SearchControlPanelProps) {
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(search.name);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [lockCode, setLockCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLocked, setIsLocked] = useState(search.is_locked || false);

  const handleRename = () => {
    if (newName.trim() && newName !== search.name) {
      onRename(search.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleLock = () => {
    if (lockCode.length === 6 && /^\d{6}$/.test(lockCode)) {
      onLock(search.id, lockCode);
      setIsLocked(true);
      setShowLockPrompt(false);
      setLockCode('');
    }
  };

  const handleUnlock = () => {
    if (lockCode.length === 6 && /^\d{6}$/.test(lockCode)) {
      onUnlock(search.id, lockCode);
      setIsLocked(false);
      setShowUnlockPrompt(false);
      setLockCode('');
    }
  };

  const handleDelete = () => {
    onDelete(search.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`linkedin-theme relative ${className}`}>
      {/* Main Control Buttons */}
      <div className="linkedin-flex">
        {/* Play/Pause/Stop Controls */}
        <div className="linkedin-flex">
          {isRunning ? (
            <>
              <button
                onClick={() => onPause(search.id)}
                className="linkedin-btn linkedin-btn-secondary"
                title="Pause search"
                disabled={isLocked}
              >
                <Pause className="h-4 w-4" />
                <span className="linkedin-sr-only">Pause</span>
              </button>
              <button
                onClick={() => onStop(search.id)}
                className="linkedin-btn linkedin-btn-danger"
                title="Stop search"
                disabled={isLocked}
              >
                <Square className="h-4 w-4" />
                <span className="linkedin-sr-only">Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onResume(search.id)}
              className="linkedin-btn linkedin-btn-primary"
              title="Start search"
              disabled={isLocked}
            >
              <Play className="h-4 w-4" />
              <span className="linkedin-sr-only">Start</span>
            </button>
          )}
        </div>

        {/* Lock Status Indicator */}
        {isLocked && (
          <div className="linkedin-status linkedin-status-paused">
            <Lock className="h-3 w-3" />
            Locked
          </div>
        )}

        {/* More Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="linkedin-btn linkedin-btn-ghost"
            title="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="linkedin-sr-only">More actions</span>
          </button>

          {/* Actions Dropdown */}
          {showActions && (
            <div className="absolute right-0 top-full mt-2 w-48 linkedin-card z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setShowActions(false);
                  }}
                  className="w-full linkedin-btn linkedin-btn-ghost justify-start"
                  disabled={isLocked}
                >
                  <Edit2 className="h-4 w-4" />
                  Rename Search
                </button>
                
                <button
                  onClick={() => {
                    if (isLocked) {
                      setShowUnlockPrompt(true);
                    } else {
                      setShowLockPrompt(true);
                    }
                    setShowActions(false);
                  }}
                  className="w-full linkedin-btn linkedin-btn-ghost justify-start"
                >
                  {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isLocked ? 'Unlock Search' : 'Lock Search'}
                </button>
                
                <div className="border-t border-linkedin-gray-200 my-2"></div>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                  className="w-full linkedin-btn linkedin-btn-danger justify-start"
                  disabled={isLocked}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {isRenaming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="linkedin-card max-w-md w-full">
            <div className="linkedin-card-header">
              <h3 className="linkedin-heading-3">Rename Search</h3>
              <button
                onClick={() => setIsRenaming(false)}
                className="linkedin-btn linkedin-btn-ghost p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="linkedin-card-body">
              <label className="linkedin-label">Search Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="linkedin-input"
                placeholder="Enter search name"
                maxLength={100}
                autoFocus
              />
            </div>
            <div className="linkedin-card-footer linkedin-flex-between">
              <button
                onClick={() => setIsRenaming(false)}
                className="linkedin-btn linkedin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="linkedin-btn linkedin-btn-primary"
                disabled={!newName.trim() || newName === search.name}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Prompt Modal */}
      {showLockPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="linkedin-card max-w-md w-full">
            <div className="linkedin-card-header">
              <h3 className="linkedin-heading-3">Lock Search</h3>
              <button
                onClick={() => {
                  setShowLockPrompt(false);
                  setLockCode('');
                }}
                className="linkedin-btn linkedin-btn-ghost p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="linkedin-card-body">
              <div className="linkedin-flex mb-4">
                <Shield className="h-5 w-5 text-linkedin-blue" />
                <div>
                  <p className="linkedin-text font-medium">Secure Your Search</p>
                  <p className="linkedin-text-sm">Enter a 6-digit code to lock this search</p>
                </div>
              </div>
              <label className="linkedin-label">6-Digit Lock Code</label>
              <input
                type="password"
                value={lockCode}
                onChange={(e) => setLockCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="linkedin-input text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              <p className="linkedin-text-sm mt-2 text-linkedin-gray-600">
                Keep this code safe. You'll need it to unlock or modify this search.
              </p>
            </div>
            <div className="linkedin-card-footer linkedin-flex-between">
              <button
                onClick={() => {
                  setShowLockPrompt(false);
                  setLockCode('');
                }}
                className="linkedin-btn linkedin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLock}
                className="linkedin-btn linkedin-btn-primary"
                disabled={lockCode.length !== 6}
              >
                <Lock className="h-4 w-4" />
                Lock Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Prompt Modal */}
      {showUnlockPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="linkedin-card max-w-md w-full">
            <div className="linkedin-card-header">
              <h3 className="linkedin-heading-3">Unlock Search</h3>
              <button
                onClick={() => {
                  setShowUnlockPrompt(false);
                  setLockCode('');
                }}
                className="linkedin-btn linkedin-btn-ghost p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="linkedin-card-body">
              <div className="linkedin-flex mb-4">
                <Unlock className="h-5 w-5 text-linkedin-green" />
                <div>
                  <p className="linkedin-text font-medium">Unlock Search</p>
                  <p className="linkedin-text-sm">Enter your 6-digit code to unlock</p>
                </div>
              </div>
              <label className="linkedin-label">6-Digit Lock Code</label>
              <input
                type="password"
                value={lockCode}
                onChange={(e) => setLockCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="linkedin-input text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="linkedin-card-footer linkedin-flex-between">
              <button
                onClick={() => {
                  setShowUnlockPrompt(false);
                  setLockCode('');
                }}
                className="linkedin-btn linkedin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                className="linkedin-btn linkedin-btn-success"
                disabled={lockCode.length !== 6}
              >
                <Unlock className="h-4 w-4" />
                Unlock Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="linkedin-card max-w-md w-full">
            <div className="linkedin-card-header">
              <h3 className="linkedin-heading-3">Delete Search</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="linkedin-btn linkedin-btn-ghost p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="linkedin-card-body">
              <div className="linkedin-flex mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="linkedin-text font-medium">Permanently Delete Search</p>
                  <p className="linkedin-text-sm">This action cannot be undone</p>
                </div>
              </div>
              <p className="linkedin-text">
                Are you sure you want to delete "<strong>{search.name}</strong>"?
              </p>
              <p className="linkedin-text-sm mt-2 text-linkedin-gray-600">
                All search history, results, and configurations will be permanently removed.
              </p>
            </div>
            <div className="linkedin-card-footer linkedin-flex-between">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="linkedin-btn linkedin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="linkedin-btn linkedin-btn-danger"
              >
                <Trash2 className="h-4 w-4" />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {showActions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}