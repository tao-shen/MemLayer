import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Session } from '@/types';
import { useChatStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: (sessionId: string) => void;
  onRename?: (sessionId: string, newName: string) => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefetch session messages on hover
  const { prefetchQuery } = useQuery({
    queryKey: ['messages', session.id],
    enabled: false,
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseEnter = () => {
    // Prefetch messages when hovering
    prefetchQuery();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const handleRename = () => {
    if (editName.trim() && editName !== session.name) {
      onRename?.(session.id, editName.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${session.name}"?`)) {
      onDelete?.(session.id);
    }
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(session.name);
      setIsEditing(false);
    }
  };

  // Get last message preview
  const lastMessagePreview = session.lastMessage
    ? session.lastMessage.length > 50
      ? session.lastMessage.substring(0, 50) + '...'
      : session.lastMessage
    : 'No messages yet';

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onContextMenu={handleContextMenu}
    >
      <button
        onClick={onSelect}
        className={`
          w-full text-left px-3 py-3 rounded-lg transition-all duration-200
          ${
            isActive
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 shadow-sm'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }
          group relative
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm font-medium bg-white dark:bg-gray-800 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="font-medium truncate text-sm">{session.name}</div>
            )}

            {/* Last message preview */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {lastMessagePreview}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
              <span>{format(new Date(session.lastMessageAt), 'MMM d, HH:mm')}</span>
              <span>•</span>
              <span>{session.messageCount} messages</span>
            </div>
          </div>

          {/* Menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`
              p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
              ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
        </div>
      </button>

      {/* Context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-2 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
