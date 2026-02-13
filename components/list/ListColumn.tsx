/**
 * ListColumn Component
 * Represents a single list (column) in the board.
 * Contains a header with editable title, sortable cards, and an add card form.
 * Uses both useSortable (for list reordering) and useDroppable (for card drops).
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { List } from '@/types/board';
import CardItem from '@/components/card/CardItem';
import AddCard from '@/components/card/AddCard';
import { Trash2 } from 'lucide-react';
import styles from './ListColumn.module.scss';

interface ListColumnProps {
  list: List;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onAddCard: (title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardTitle: (cardId: string, title: string) => void;
  onOpenComments: (cardId: string) => void;
}

export default function ListColumn({
  list,
  onTitleChange,
  onDelete,
  onAddCard,
  onDeleteCard,
  onUpdateCardTitle,
  onOpenComments,
}: ListColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sortable for list reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  // Extract aria-describedby to prevent hydration mismatch (dnd-kit generates dynamic IDs)
  const { 'aria-describedby': _ariaDescribedBy, ...safeAttributes } = attributes;

  // Droppable for receiving cards into this list
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = list.cards.map((card) => card.id);

  useEffect(() => {
    setTitleValue(list.title);
  }, [list.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== list.title) {
      onTitleChange(trimmed);
    } else {
      setTitleValue(list.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(list.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`${styles.list} ${isDragging ? styles.listDragging : ''}`}
    >
      {/* List Header - draggable handle */}
      <div className={styles.listHeader} {...safeAttributes} {...listeners}>
        <div className={styles.titleWrapper}>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              className={styles.listTitleInput}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Edit list title: ${list.title}`}
            />
          ) : (
            <span
              className={styles.listTitle}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }
              }}
              aria-label={`List: ${list.title}. Click to edit.`}
            >
              {list.title}
            </span>
          )}
        </div>

        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Delete list: ${list.title}`}
          title="Delete list"
        >
          <Trash2 />
        </button>
      </div>

      {/* Cards Container - also a droppable zone */}
      <div
        ref={setDroppableRef}
        className={`${styles.cardsContainer} ${isOver ? styles.cardsContainerOver : ''}`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              listId={list.id}
              onTitleChange={(title) => onUpdateCardTitle(card.id, title)}
              onDelete={() => onDeleteCard(card.id)}
              onOpenComments={() => onOpenComments(card.id)}
            />
          ))}
        </SortableContext>

        {/* Placeholder for empty lists */}
        {list.cards.length === 0 && (
          <div className={`${styles.emptyPlaceholder} ${isOver ? styles.emptyPlaceholderOver : ''}`}>
            <span>Drop cards here</span>
          </div>
        )}
      </div>

      {/* Add Card Footer */}
      <div className={styles.footer}>
        <AddCard onAdd={onAddCard} />
      </div>
    </div>
  );
}
