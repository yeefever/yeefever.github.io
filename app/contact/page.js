import LayoutBase from '../components/layoutbase';

export default function Contact() {
  return (
    <LayoutBase>
      <article className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="text-2xl font-semibold mb-8">Contact</h1>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="mailto:kliu2360@seas.upenn.edu"
              className="underline underline-offset-2 hover:text-[var(--foreground-muted)]"
            >
              kliu2360@seas.upenn.edu
            </a>
          </li>
          <li>
            <a
              href="https://github.com/yeefever"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--foreground-muted)]"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/kevin-liu-33478b234/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--foreground-muted)]"
            >
              LinkedIn
            </a>
          </li>
        </ul>
      </article>
    </LayoutBase>
  );
}
