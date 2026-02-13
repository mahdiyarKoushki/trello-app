/**
 * AddList Component
 * Provides a form to create new lists in the board.
 * Toggles between a trigger button and an input form.
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import styles from './AddList.module.scss';

interface AddListProps {
  onAdd: (title: string) => void;
}

export default function AddList({ onAdd }: AddListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onAdd(trimmed);
      setTitle('');
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <div className={styles.wrapper}>
        <button
          className={styles.trigger}
          onClick={() => setIsAdding(true)}
          aria-label="Add another list"
        >
          <Plus />
          <span>Add another list</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Enter list title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="List title"
        />
        <div className={styles.formActions}>
          <button
            className={styles.addBtn}
            onClick={handleSubmit}
            disabled={!title.trim()}
            aria-label="Add list"
          >
            Add list
          </button>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            aria-label="Cancel adding list"
          >
            {'×'}
          </button>
        </div>
      </div>
    </div>
  );
}
