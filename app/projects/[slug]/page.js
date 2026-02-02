import { notFound } from 'next/navigation';
import LayoutBase from '../../components/layoutbase';
import Link from 'next/link';
import { projectsData } from '../../data/projects';
import { getProjectContent, getProjectPdf, getProjectScreenshots, getProjectVideo } from '../../lib/content';
import PdfEmbed from '../../components/PdfEmbed';

/**
 * Dynamic project detail page. Renders content from projectsData and optional
 * text file + PDF. Add new projects in app/data/projects.js and content in
 * app/lib/content.js (slugToContentFile, slugToPdf).
 */
export async function generateStaticParams() {
  return projectsData.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = projectsData.find((p) => p.slug === slug);
  if (!project) notFound();

  const content = getProjectContent(slug);
  const pdfPath = getProjectPdf(slug);
  const screenshots = getProjectScreenshots(slug);
  const videoPath = getProjectVideo(slug);

  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        <Link
          href="/projects"
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-8 inline-block"
        >
          ← Projects
        </Link>
        {videoPath && (
          <div className="mb-8 rounded overflow-hidden border border-[var(--border)]">
            <video
              src={videoPath}
              controls
              className="w-full"
            />
          </div>
        )}
        {project.image && !videoPath && (
          <div className="mb-8 rounded overflow-hidden border border-[var(--border)]">
            <img
              src={project.image}
              alt={project.title}
              className="w-full object-contain max-h-64 bg-[var(--background)]"
            />
          </div>
        )}
        <h1 className="text-2xl font-semibold mb-2">{project.title}</h1>
        <p className="text-[var(--foreground-muted)] mb-6">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {project.tags.map((tag) => (
            <span key={tag} className="text-xs text-[var(--foreground-muted)]">
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
        {content && (
          <div className="prose-custom mb-12 whitespace-pre-wrap">{content}</div>
        )}
        {screenshots.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold mb-4">Screenshots</h2>
            <div className="grid grid-cols-2 gap-4">
              {screenshots.map((src, i) => (
                <img key={i} src={src} alt={`Screenshot ${i + 1}`} className="w-full rounded" />
              ))}
            </div>
          </div>
        )}
        {pdfPath && (
          <div className="border-t border-[var(--border)] pt-8">
            <PdfEmbed pdfPath={pdfPath} buttonText="Paper" />
          </div>
        )}
      </article>
    </LayoutBase>
  );
}
