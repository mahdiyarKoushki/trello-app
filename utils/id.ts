/**
 * ID Generator Utility
 * Generates unique IDs for lists, cards, and comments.
 */

import { v4 as uuidv4 } from 'uuid';

export function generateId(prefix: string = ''): string {
  const id = uuidv4();
  return prefix ? `${prefix}-${id}` : id;
}
