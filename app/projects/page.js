import LayoutBase from '../components/layoutbase';
import Link from 'next/link';
import { projectsData } from '../data/projects';

export default function ProjectsIndex() {
  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-2xl font-semibold mb-4">Projects</h1>
        <p className="text-[var(--foreground-muted)] mb-12 max-w-prose">
          A selection of things I&apos;ve built or contributed to. Each has a short write-up with more context.
        </p>
        <ul className="space-y-10">
          {projectsData.map((project) => (
            <li key={project.slug} className="border-b border-[var(--border)] pb-8 last:border-0">
              <Link href={`/projects/${project.slug}`} className="group flex gap-6 mb-3">
                {project.image && (
                  <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden border border-[var(--border)]">
                    <img
                      src={project.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-medium group-hover:underline mb-1">
                    {project.title}
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {project.description}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-[var(--foreground-muted)]"
                  >
                    {tag}
                  </span>
                ))}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-2 hover:text-[var(--foreground-muted)]"
                  >
                    Code
                  </a>
                )}
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-2 hover:text-[var(--foreground-muted)]"
                  >
                    Website
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </article>
    </LayoutBase>
  );
}
