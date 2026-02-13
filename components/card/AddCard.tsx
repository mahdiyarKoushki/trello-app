/**
 * AddCard Component
 * Provides a form to add new cards to a list.
 * Toggles between a button trigger and an input form.
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import styles from './AddCard.module.scss';

interface AddCardProps {
  onAdd: (title: string) => void;
}

export default function AddCard({ onAdd }: AddCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onAdd(trimmed);
      setTitle('');
      // Keep the form open for rapid entry
      textareaRef.current?.focus();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <button
        className={styles.trigger}
        onClick={() => setIsAdding(true)}
        aria-label="Add another card"
      >
        <Plus />
        <span>Add another card</span>
      </button>
    );
  }

  return (
    <div className={styles.form}>
      <textarea
        ref={textareaRef}
        className={styles.input}
        placeholder="Enter a title for this card..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Card title"
        rows={2}
      />
      <div className={styles.formActions}>
        <button
          className={styles.addBtn}
          onClick={handleSubmit}
          disabled={!title.trim()}
          aria-label="Add card"
        >
          Add card
        </button>
        <button
          className={styles.cancelBtn}
          onClick={handleCancel}
          aria-label="Cancel adding card"
        >
          {'×'}
        </button>
      </div>
    </div>
  );
}
