import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Get all blog posts, sorted by date descending.
 * Convention: add markdown files to content/blog/ as YYYY-MM-DD-slug.md
 * Required frontmatter: title, date
 */
export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter(
    (f) => f.endsWith('.md') && !f.toLowerCase().startsWith('readme')
  );
  const posts = files.map((filename) => {
    const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const fullPath = path.join(BLOG_DIR, filename);
    const { data, content } = matter(fs.readFileSync(fullPath, 'utf-8'));
    return {
      slug,
      title: data.title,
      date: data.date,
      content,
    };
  });
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get a single post by slug.
 */
export function getPostBySlug(slug) {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}
