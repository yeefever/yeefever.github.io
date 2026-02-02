import LayoutBase from '../components/layoutbase';
import Link from 'next/link';
import { getAllPosts } from '../lib/blog';

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-2xl font-semibold mb-4">Blog</h1>
        <p className="text-[var(--foreground-muted)] mb-12 max-w-prose">
          Occasional notes and essays.
        </p>
        {posts.length === 0 ? (
          <p className="text-[var(--foreground-muted)]">No posts yet.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-[var(--border)] pb-6 last:border-0">
                <Link href={`/blog/${post.slug}`} className="group block">
                  <h2 className="text-lg font-medium group-hover:underline mb-1">
                    {post.title}
                  </h2>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    {post.blurb && (
                      <span className="ml-2">— {post.blurb}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </LayoutBase>
  );
}
