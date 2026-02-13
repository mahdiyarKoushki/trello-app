/**
 * CardItem Component
 * Displays a single card with inline title editing,
 * comment count badge, and action buttons.
 * Smoothly draggable via @dnd-kit/sortable.
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '@/types/board';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import styles from './CardItem.module.scss';

interface CardItemProps {
  card: Card;
  listId: string;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onOpenComments: () => void;
}

export default function CardItem({
  card,
  listId,
  onTitleChange,
  onDelete,
  onOpenComments,
}: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      listId,
    },
    // Disable sorting while editing
    disabled: isEditing,
  });

  // Extract aria-describedby to prevent hydration mismatch (dnd-kit generates dynamic IDs)
  const { 'aria-describedby': _ariaDescribedBy, ...safeAttributes } = attributes;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  useEffect(() => {
    setEditValue(card.title);
  }, [card.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== card.title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(card.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(card.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
      {...safeAttributes}
      {...listeners}
    >
      <div className={styles.cardContent}>
        <div className={styles.titleWrapper}>
          {isEditing ? (
            <input
              ref={inputRef}
              className={styles.editInput}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Edit card title: ${card.title}`}
            />
          ) : (
            <span className={styles.cardTitle}>{card.title}</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Edit card"
            title="Edit card"
          >
            <Pencil size={12} />
          </button>
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Delete card"
            title="Delete card"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <button
        className={styles.commentBadge}
        onClick={(e) => {
          e.stopPropagation();
          onOpenComments();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Comments (${card.comments.length})`}
      >
        <MessageSquare />
        <span>{`Comments (${card.comments.length})`}</span>
      </button>
    </div>
  );
}
