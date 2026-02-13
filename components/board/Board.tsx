/**
 * Board Component
 * The main board that contains all lists and manages drag-and-drop.
 * Uses @dnd-kit for both horizontal list reordering and
 * vertical/cross-list card moving.
 */

'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoard } from '@/hooks/use-board';
import { useIsMobile } from '@/hooks/use-mobile';
import BoardHeader from './BoardHeader';
import ListColumn from '@/components/list/ListColumn';
import AddList from '@/components/list/AddList';
import CommentsModal from '@/components/modal/CommentsModal';
import { MessageSquare } from 'lucide-react';
import styles from './Board.module.scss';

interface ActiveCommentModal {
  listId: string;
  cardId: string;
}

export default function Board() {
  const {
    board,
    updateBoardTitle,
    addList,
    deleteList,
    updateListTitle,
    moveList,
    addCard,
    deleteCard,
    updateCardTitle,
    moveCard,
    addComment,
    getCard,
  } = useBoard();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<'list' | 'card' | null>(null);
  const [commentModal, setCommentModal] = useState<ActiveCommentModal | null>(
    null,
  );

  // Mobile detection
  const isMobile = useIsMobile();

  // Track the list the dragged card originally belonged to
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  // DnD Sensors with activation constraints for smoother dragging
  // Use higher distance threshold on mobile to prevent accidental drags while scrolling
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 12 : 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const listIds = useMemo(
    () => board.lists.map((list) => list.id),
    [board.lists],
  );

  // Helper: Find which list a given ID belongs to (card or list itself)
  const findContainer = useCallback(
    (id: UniqueIdentifier): string | undefined => {
      // Check if it's a list id
      if (board.lists.some((l) => l.id === id)) {
        return id as string;
      }
      // Check if it's a card id inside some list
      for (const list of board.lists) {
        if (list.cards.some((c) => c.id === id)) {
          return list.id;
        }
      }
      return undefined;
    },
    [board.lists],
  );

  /**
   * Custom collision detection strategy.
   * Uses pointerWithin for cards (so you can drop into empty lists)
   * and closestCenter for lists.
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeType === 'list') {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            listIds.includes(container.id as string),
          ),
        });
      }

      // For cards: first try pointerWithin
      const pointerCollisions = pointerWithin(args);
      const collisions =
        pointerCollisions.length > 0
          ? pointerCollisions
          : rectIntersection(args);

      let overId = getFirstCollision(collisions, 'id');

      if (overId != null) {
        // If over a list container, find the closest card inside it
        if (listIds.includes(overId as string)) {
          const list = board.lists.find((l) => l.id === overId);
          if (list && list.cards.length > 0) {
            const cardIds = list.cards.map((c) => c.id);
            const closestCard = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) => cardIds.includes(container.id as string),
              ),
            });
            if (closestCard.length > 0) {
              overId = closestCard[0].id;
            }
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      // When dragging over no container, keep the last known
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, activeType, board.lists, listIds],
  );

  // Find the active card or list for overlay
  const activeCard = useMemo(() => {
    if (activeType !== 'card' || !activeId) return null;
    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === activeId);
      if (card) return card;
    }
    return null;
  }, [activeId, activeType, board.lists]);

  const activeList = useMemo(() => {
    if (activeType !== 'list' || !activeId) return null;
    return board.lists.find((l) => l.id === activeId) || null;
  }, [activeId, activeType, board.lists]);

  /** Handle drag start */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'list') {
      setActiveType('list');
      setActiveId(active.id);
    } else if (data?.type === 'card') {
      setActiveType('card');
      setActiveId(active.id);
    }
  }, []);

  /** Handle drag over - cross-list card movement */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;
      if (activeType !== 'card') return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer) return;
      if (activeContainer === overContainer) return;

      // Cross-list movement
      const sourceList = board.lists.find((l) => l.id === activeContainer);
      const destList = board.lists.find((l) => l.id === overContainer);
      if (!sourceList || !destList) return;

      const activeIndex = sourceList.cards.findIndex(
        (c) => c.id === active.id,
      );
      if (activeIndex === -1) return;

      // Determine destination index
      let newIndex: number;
      const overIndex = destList.cards.findIndex((c) => c.id === over.id);

      if (listIds.includes(over.id as string)) {
        // Dropping on the list itself (empty area) -> add to end
        newIndex = destList.cards.length;
      } else {
        // Dropping on a card
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height / 2;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : destList.cards.length;
      }

      recentlyMovedToNewContainer.current = true;
      moveCard(activeContainer, overContainer, activeIndex, newIndex);
    },
    [activeType, board.lists, findContainer, listIds, moveCard],
  );

  /** Handle drag end - finalize position */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Reset active state
      setActiveId(null);
      setActiveType(null);
      recentlyMovedToNewContainer.current = false;

      if (!over) return;

      // Handle list reordering
      if (active.data.current?.type === 'list') {
        if (active.id !== over.id) {
          const fromIndex = board.lists.findIndex((l) => l.id === active.id);
          const toIndex = board.lists.findIndex((l) => l.id === over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            moveList(fromIndex, toIndex);
          }
        }
        return;
      }

      // Handle card sorting within same list
      if (active.data.current?.type === 'card') {
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
          const list = board.lists.find((l) => l.id === activeContainer);
          if (!list) return;

          const activeIndex = list.cards.findIndex((c) => c.id === active.id);
          const overIndex = list.cards.findIndex((c) => c.id === over.id);

          if (
            activeIndex !== -1 &&
            overIndex !== -1 &&
            activeIndex !== overIndex
          ) {
            moveCard(activeContainer, activeContainer, activeIndex, overIndex);
          }
        }
      }
    },
    [board.lists, findContainer, moveList, moveCard],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    recentlyMovedToNewContainer.current = false;
  }, []);

  /** Open comments modal for a specific card */
  const handleOpenComments = useCallback(
    (listId: string, cardId: string) => {
      setCommentModal({ listId, cardId });
    },
    [],
  );

  const handleCloseComments = useCallback(() => {
    setCommentModal(null);
  }, []);

  // Get the card data for the comments modal
  const modalCard = commentModal
    ? getCard(commentModal.listId, commentModal.cardId)
    : null;
  const modalListTitle = commentModal
    ? board.lists.find((l) => l.id === commentModal.listId)?.title || ''
    : '';

  return (
    <div className={styles.boardWrapper}>
      <BoardHeader title={board.title} onTitleChange={updateBoardTitle} />

      <div className={styles.boardContent}>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className={styles.listsContainer}>
            <SortableContext
              items={listIds}
              strategy={horizontalListSortingStrategy}
            >
              {board.lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  onTitleChange={(title) => updateListTitle(list.id, title)}
                  onDelete={() => deleteList(list.id)}
                  onAddCard={(title) => addCard(list.id, title)}
                  onDeleteCard={(cardId) => deleteCard(list.id, cardId)}
                  onUpdateCardTitle={(cardId, title) =>
                    updateCardTitle(list.id, cardId, title)
                  }
                  onOpenComments={(cardId) =>
                    handleOpenComments(list.id, cardId)
                  }
                />
              ))}
            </SortableContext>

            <AddList onAdd={addList} />
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeCard && (
              <div className={styles.dragOverlayCard}>
                <div className={styles.overlayTitle}>{activeCard.title}</div>
                <div className={styles.overlayBadge}>
                  <MessageSquare size={14} />
                  <span>{`Comments (${activeCard.comments.length})`}</span>
                </div>
              </div>
            )}
            {activeList && (
              <div className={styles.dragOverlayList}>
                <div className={styles.overlayListTitle}>
                  {activeList.title}
                </div>
                <div className={styles.overlayListCards}>
                  {activeList.cards.slice(0, 3).map((card) => (
                    <div key={card.id} className={styles.overlayListCard}>
                      {card.title}
                    </div>
                  ))}
                  {activeList.cards.length > 3 && (
                    <div className={styles.overlayListMore}>
                      {`+${activeList.cards.length - 3} more`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Comments Modal */}
      {commentModal && modalCard && (
        <CommentsModal
          card={modalCard}
          listTitle={modalListTitle}
          onClose={handleCloseComments}
          onAddComment={(text) =>
            addComment(commentModal.listId, commentModal.cardId, text)
          }
        />
      )}
    </div>
  );
}
