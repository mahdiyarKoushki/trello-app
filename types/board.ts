/**
 * Core domain types for the Trello Clone application.
 * These types define the data structures used throughout the app.
 */

/** Represents a single comment on a card */
export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

/** Represents a card within a list */
export interface Card {
  id: string;
  title: string;
  comments: Comment[];
  createdAt: string;
}

/** Represents a list (column) within a board */
export interface List {
  id: string;
  title: string;
  cards: Card[];
}

/** Represents the entire board */
export interface Board {
  id: string;
  title: string;
  lists: List[];
}

/** Initial default board data used when no saved data exists */
export const DEFAULT_BOARD: Board = {
  id: 'board-1',
  title: 'Demo Board',
  lists: [
    {
      id: 'list-1',
      title: 'Todo',
      cards: [
        {
          id: 'card-1',
          title: 'Create interview Kanban',
          comments: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'card-2',
          title: 'Review Drag & Drop',
          comments: [],
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'list-2',
      title: 'In Progress',
      cards: [
        {
          id: 'card-3',
          title: 'Set up Next.js project',
          comments: [],
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'list-3',
      title: 'Done',
      cards: [],
    },
  ],
};
