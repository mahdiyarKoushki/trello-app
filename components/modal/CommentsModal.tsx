/**
 * CommentsModal Component
 * A modal dialog to view and add comments for a specific card.
 * Input and save button are positioned BELOW the comments list.
 */

'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import type { Card } from '@/types/board';
import { X, MessageSquare, CreditCard } from 'lucide-react';
import styles from './CommentsModal.module.scss';

interface CommentsModalProps {
  card: Card;
  listTitle: string;
  onClose: () => void;
  onAddComment: (text: string) => void;
}

/** Format ISO date string to human-readable format */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
}

export default function CommentsModal({
  card,
  listTitle,
  onClose,
  onAddComment,
}: CommentsModalProps) {
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll to bottom when new comment is added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [card.comments.length]);

  const handleSubmit = () => {
    const trimmed = commentText.trim();
    if (trimmed) {
      onAddComment(trimmed);
      setCommentText('');
      textareaRef.current?.focus();
    }
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** Close modal when overlay is clicked */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Comments for card: ${card.title}`}
    >
      <div className={styles.modal}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <CreditCard />
            <div>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.listName}>
                {'in list '}
                <strong>{listTitle}</strong>
              </div>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          <div className={styles.commentsSection}>
            <div className={styles.sectionTitle}>
              <MessageSquare />
              <span>Comments</span>
            </div>

            {/* Comments List - ABOVE the input */}
            {card.comments.length > 0 ? (
              <div className={styles.commentsList}>
                {card.comments.map((comment) => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        <span className={styles.commentAvatar}>
                          {comment.author.charAt(0).toUpperCase()}
                        </span>
                        <span>{comment.author}</span>
                      </div>
                      <span className={styles.commentDate}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className={styles.commentText}>{comment.text}</div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            ) : (
              <div className={styles.emptyComments}>
                <MessageSquare />
                <div>No comments yet</div>
                <p>Add a comment to start a conversation.</p>
              </div>
            )}

            {/* Comment Input Form - BELOW the comments */}
            <div className={styles.commentForm}>
              <textarea
                ref={textareaRef}
                className={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                rows={2}
                aria-label="Write a comment"
              />
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!commentText.trim()}
                aria-label="Save comment"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
