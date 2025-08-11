import React, { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Folder,
  Star,
  Archive,
  Settings,
  Grid3X3,
  Search,
  Filter
} from 'lucide-react';
import { TaskBoard } from '../../types/TaskBoard';

interface BoardSelectorProps {
  boards: TaskBoard[];
  currentBoard: TaskBoard | null;
  onBoardSelect: (board: TaskBoard) => void;
  onCreateBoard: () => void;
  onShowArchived: () => void;
  onShowSettings: () => void;
}

export default function BoardSelector({
  boards,
  currentBoard,
  onBoardSelect,
  onCreateBoard,
  onShowArchived,
  onShowSettings
}: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeBoards = boards.filter(board => !board.is_archived);
  const favoriteBoards = activeBoards.filter(board => board.is_favorite);
  const recentBoards = activeBoards
    .filter(board => !board.is_favorite)
    .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
    .slice(0, 5);

  const filteredBoards = searchQuery
    ? activeBoards.filter(board => 
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeBoards;

  return (
    <div className="relative">
      {/* Current Board Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[300px]"
      >
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg ${currentBoard?.color_scheme || 'bg-gradient-to-r from-blue-500 to-purple-600'} flex items-center justify-center`}>
            <Grid3X3 className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">
              {currentBoard?.name || 'Select Board'}
            </h3>
            {currentBoard?.is_favorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          {currentBoard?.description && (
            <p className="text-sm text-gray-600 truncate">
              {currentBoard.description}
            </p>
          )}
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs text-gray-500">
              {currentBoard?.tasks?.length || 0} tasks
            </span>
            <span className="text-xs text-gray-500">
              {currentBoard?.progress_percentage || 0}% complete
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {searchQuery ? (
              /* Search Results */
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                  Search Results ({filteredBoards.length})
                </div>
                {filteredBoards.map(board => (
                  <BoardItem
                    key={board.id}
                    board={board}
                    isSelected={board.id === currentBoard?.id}
                    onSelect={() => {
                      onBoardSelect(board);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  />
                ))}
                {filteredBoards.length === 0 && (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    No boards found matching "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              /* Organized Board List */
              <div className="p-2 space-y-3">
                {/* Favorites */}
                {favoriteBoards.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 uppercase px-2 py-1">
                      <Star className="h-3 w-3" />
                      <span>Favorites</span>
                    </div>
                    {favoriteBoards.map(board => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        isSelected={board.id === currentBoard?.id}
                        onSelect={() => {
                          onBoardSelect(board);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Recent */}
                {recentBoards.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                      Recent
                    </div>
                    {recentBoards.map(board => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        isSelected={board.id === currentBoard?.id}
                        onSelect={() => {
                          onBoardSelect(board);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* All Boards (if no favorites/recent or few boards) */}
                {(favoriteBoards.length === 0 && recentBoards.length === 0) && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                      All Boards
                    </div>
                    {activeBoards.map(board => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        isSelected={board.id === currentBoard?.id}
                        onSelect={() => {
                          onBoardSelect(board);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t bg-gray-50">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  onCreateBoard();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Board</span>
              </button>
              
              <button
                onClick={() => {
                  onShowArchived();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Archive className="h-4 w-4" />
                <span>View Archived Boards</span>
              </button>
              
              <button
                onClick={() => {
                  onShowSettings();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Board Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}

interface BoardItemProps {
  board: TaskBoard;
  isSelected: boolean;
  onSelect: () => void;
}

function BoardItem({ board, isSelected, onSelect }: BoardItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        isSelected 
          ? 'bg-blue-100 text-blue-900' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex-shrink-0">
        <div className={`w-6 h-6 rounded ${board.color_scheme || 'bg-gradient-to-r from-blue-500 to-purple-600'} flex items-center justify-center`}>
          <Folder className="h-3 w-3 text-white" />
        </div>
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{board.name}</span>
          {board.is_favorite && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{board.tasks?.length || 0} tasks</span>
          <span>•</span>
          <span>{board.progress_percentage || 0}% complete</span>
        </div>
      </div>
    </button>
  );
}