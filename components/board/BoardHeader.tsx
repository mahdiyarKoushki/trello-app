/**
 * BoardHeader Component
 * Displays the board title with inline editing support.
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import styles from './BoardHeader.module.scss';

interface BoardHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export default function BoardHeader({ title, onTitleChange }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /** Save the edited title and exit editing mode */
  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title);
    }
    setIsEditing(false);
  };

  /** Handle keyboard events: Enter to save, Escape to cancel */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleWrapper}>
        {isEditing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            aria-label="Edit board title"
          />
        ) : (
          <h1
            className={styles.title}
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
            }}
            aria-label={`Board title: ${title}. Click to edit.`}
          >
            {title}
          </h1>
        )}
      </div>
    </header>
  );
}
