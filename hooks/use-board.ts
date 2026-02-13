/**
 * useBoard - Custom hook for board state management.
 * Handles all CRUD operations for board, lists, cards, and comments.
 * Pure in-memory state (no localStorage persistence).
 */

'use client';

import { useState, useCallback } from 'react';
import type { Board, List, Card, Comment } from '@/types/board';
import { DEFAULT_BOARD } from '@/types/board';
import { generateId } from '@/utils/id';

export interface UseBoardReturn {
  board: Board;

  // Board operations
  updateBoardTitle: (title: string) => void;

  // List operations
  addList: (title: string) => void;
  deleteList: (listId: string) => void;
  updateListTitle: (listId: string, title: string) => void;
  moveList: (fromIndex: number, toIndex: number) => void;

  // Card operations
  addCard: (listId: string, title: string) => void;
  deleteCard: (listId: string, cardId: string) => void;
  updateCardTitle: (listId: string, cardId: string, title: string) => void;
  moveCard: (
    sourceListId: string,
    destListId: string,
    sourceIndex: number,
    destIndex: number,
  ) => void;

  // Comment operations
  addComment: (listId: string, cardId: string, text: string) => void;
  getCard: (listId: string, cardId: string) => Card | undefined;
}

export function useBoard(): UseBoardReturn {
  const [board, setBoard] = useState<Board>(DEFAULT_BOARD);

  // --- Board Operations ---
  const updateBoardTitle = useCallback((title: string) => {
    setBoard((prev) => ({ ...prev, title }));
  }, []);

  // --- List Operations ---
  const addList = useCallback((title: string) => {
    const newList: List = {
      id: generateId('list'),
      title,
      cards: [],
    };
    setBoard((prev) => ({
      ...prev,
      lists: [...prev.lists, newList],
    }));
  }, []);

  const deleteList = useCallback((listId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.filter((list) => list.id !== listId),
    }));
  }, []);

  const updateListTitle = useCallback((listId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === listId ? { ...list, title } : list,
      ),
    }));
  }, []);

  const moveList = useCallback((fromIndex: number, toIndex: number) => {
    setBoard((prev) => {
      const newLists = [...prev.lists];
      const [moved] = newLists.splice(fromIndex, 1);
      newLists.splice(toIndex, 0, moved);
      return { ...prev, lists: newLists };
    });
  }, []);

  // --- Card Operations ---
  const addCard = useCallback((listId: string, title: string) => {
    const newCard: Card = {
      id: generateId('card'),
      title,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list,
      ),
    }));
  }, []);

  const deleteCard = useCallback((listId: string, cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) =>
        list.id === listId
          ? { ...list, cards: list.cards.filter((c) => c.id !== cardId) }
          : list,
      ),
    }));
  }, []);

  const updateCardTitle = useCallback(
    (listId: string, cardId: string, title: string) => {
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: list.cards.map((card) =>
                  card.id === cardId ? { ...card, title } : card,
                ),
              }
            : list,
        ),
      }));
    },
    [],
  );

  const moveCard = useCallback(
    (
      sourceListId: string,
      destListId: string,
      sourceIndex: number,
      destIndex: number,
    ) => {
      setBoard((prev) => {
        const newLists = prev.lists.map((list) => ({
          ...list,
          cards: [...list.cards],
        }));

        const sourceList = newLists.find((l) => l.id === sourceListId);
        const destList = newLists.find((l) => l.id === destListId);

        if (!sourceList || !destList) return prev;
        if (sourceIndex < 0 || sourceIndex >= sourceList.cards.length)
          return prev;

        const [movedCard] = sourceList.cards.splice(sourceIndex, 1);
        if (!movedCard) return prev;

        const clampedDest = Math.min(destIndex, destList.cards.length);
        destList.cards.splice(clampedDest, 0, movedCard);

        return { ...prev, lists: newLists };
      });
    },
    [],
  );

  // --- Comment Operations ---
  const addComment = useCallback(
    (listId: string, cardId: string, text: string) => {
      const newComment: Comment = {
        id: generateId('comment'),
        text,
        author: 'User',
        createdAt: new Date().toISOString(),
      };
      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: list.cards.map((card) =>
                  card.id === cardId
                    ? { ...card, comments: [...card.comments, newComment] }
                    : card,
                ),
              }
            : list,
        ),
      }));
    },
    [],
  );

  const getCard = useCallback(
    (listId: string, cardId: string): Card | undefined => {
      const list = board.lists.find((l) => l.id === listId);
      return list?.cards.find((c) => c.id === cardId);
    },
    [board],
  );

  return {
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
  };
}
