import { notFound } from 'next/navigation';
import LayoutBase from '../../components/layoutbase';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '../../lib/blog';
import { renderMarkdown } from '../../lib/markdown';

export async function generateStaticParams() {
  try {
    const posts = getAllPosts();
    const params = posts.map((p) => ({ slug: p.slug }));
    return params.length > 0 ? params : [{ slug: '_placeholder' }];
  } catch {
    return [{ slug: '_placeholder' }];
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        <Link
          href="/blog"
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-8 inline-block"
        >
          ← Blog
        </Link>
        <h1 className="text-2xl font-semibold mb-2">{post.title}</h1>
        <time
          dateTime={post.date}
          className="text-sm text-[var(--foreground-muted)] block mb-6"
        >
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </LayoutBase>
  );
}
