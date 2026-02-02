import { marked } from 'marked';

/**
 * Render markdown to HTML. Used for blog posts (server-side only).
 */
export function renderMarkdown(content) {
  marked.setOptions({ gfm: true });
  return marked.parse(content);
}
