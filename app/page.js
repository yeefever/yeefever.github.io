import LayoutBase from './components/layoutbase';
import Link from 'next/link';
import { projectsData } from './data/projects';

const publicationsData = [
  {
    title: 'Zero-Shot Extraction of Seizure Outcomes from Clinical Notes Using Generative Pretrained Transformers',
    authors: 'William K. S. Ojemann, Kevin Xie, Kevin Liu, Ellie Chang, Dan Roth, Brian Litt, Colin A. Ellis',
    venue: 'Journal of Healthcare Informatics Research, 2025',
    link: 'https://link.springer.com/article/10.1007/s41666-025-00198-5',
    description: 'Investigated using GPT models for extracting seizure outcomes from epilepsy clinic notes, achieving strong zero-shot performance that outperformed baseline BERT in sparse clinical contexts.',
  },
];

export default function Home() {
  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        {/* Prose section — personal, reflective, minimal */}
        <section className="prose-custom mb-20">
          <h1 className="text-2xl font-semibold mb-8">Kevin Liu</h1>
          <p>
            I study computer science and economics at the University of Pennsylvania, with a Master's in Robotics. My favorite animal is the capybara. I enjoy solving about problems that sit at the intersection of theory and practice. I try to build simple things that make life happier.
          </p>
        </section>

        {/* Publications */}
        <section className="mb-20">
          <h2 className="text-lg font-semibold mb-6">Publications</h2>
          <div className="space-y-8">
            {publicationsData.map((pub, i) => (
              <div key={i} className="border-b border-[var(--border)] pb-6 last:border-0">
                <h3 className="font-medium mb-1">{pub.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">
                  {pub.authors.split(/(Kevin Liu)/g).map((part, j) =>
                    part === 'Kevin Liu' ? <strong key={j}>{part}</strong> : part
                  )}
                </p>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">{pub.venue}</p>
                <p className="text-sm mb-2">{pub.description}</p>
                <a
                  href={pub.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline underline-offset-2 hover:text-[var(--foreground-muted)]"
                >
                  Read paper
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Projects preview */}
        <section>
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link
              href="/projects"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              View all
            </Link>
          </div>
          <ul className="space-y-4">
            {projectsData.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="flex gap-4 group"
                >
                  {p.image && (
                    <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-[var(--border)]">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-medium group-hover:underline">{p.title}</span>
                    <span className="text-[var(--foreground-muted)]"> — {p.description}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </LayoutBase>
  );
}
