import React from 'react';
import Link from 'next/link';
import LayoutBase from '../components/layoutbase.js';


const projectsData = [
  {
    title: 'Bocchi the Rock Desktop Extension',
    slug: 'bocchi-desktop',
    imageSrc: '/images/bocchi_peek_vert.jpg',
    description: 'Dino Bocchi appears on screen.',
    url: "https://github.com/yeefever/bocchi-desktop",
    tags: ['C#', '.NET'],
    finished: false
  },
  {
    title: 'Pixiv Scraper',
    slug: 'pixiv_scrape',
    imageSrc: '/images/pixiv_scrape.png',
    description: 'Scrapes arts off pixiv and sends them to people periodically.',
    url: 'https://github.com/yeefever/BocchiSender',
    tags: ['Node.js'],
    finished: true
  },
  {
    title: 'Not Real Facts Generator',
    slug: 'not-real-facts',
    imageSrc: '/images/bruh.jpg',
    description: 'Fine-tuned T5 transformer to generate terrible facts.',
    url: 'https://github.com/yeefever/unreal_facts',
    tags: ['NLP'],
    finished: false
  },
  {
    title: 'Event Bot',
    slug: 'event-bot',
    imageSrc: '/images/event.png',
    description: 'Facilitating event registration through discord.',
    url: 'https://github.com/yeefever/#',
    tags: ['C#', 'D#+'],
    finished: true
  },
  {
    title: 'Anime Recommender',
    slug: 'anime-recommend',
    imageSrc: '/images/mal.png',
    description: 'Recommending Anime.',
    url: 'https://github.com/yeefever/event-bot',
    tags: ['NLP', 'ML'],
    finished: false
  },
  {
    title: 'Talking Bocchi',
    slug: 'talking-bocchi',
    imageSrc: '/images/talking.png',
    description: 'Talking bocchi :)',
    url: 'https://github.com/yeefever/#',
    tags: ['JS'],
    finished: true
  },

];

projectsData.sort((a, b) => a.title.localeCompare(b.title));

const Projects = () => {
  return (
    <LayoutBase>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="grid grid-cols-3 gap-4">
          {projectsData.map((project, index) => (
            <Link key={project.slug} href={`/projects/${project.slug}`} passHref legacyBehavior>
              <a className="block">
                <div className="bg-white rounded p-4 shadow cursor-pointer flex flex-col justify-center items-center">
                  <img
                    src={project.imageSrc}
                    alt={project.title}
                    className="mb-2 w-full h-32 object-contain"
                  />
                  <h3 className="text-lg font-semibold text-center mb-1">{project.title}</h3>
                  <p className="text-sm text-center">{project.description}</p>
                  <div className="mt-2 flex">
                    {project.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center bg-slate-500 text-white text-xs px-3 py-1 rounded-full mr-2"
                      >
                        <span className="mr-1">{tag}</span>
                        <span className="h-2 w-2 bg-white rounded-full"></span>
                      </span>
                    ))}
                    {!project.finished && (
                      <span
                        className="inline-flex items-center bg-red-500 text-white text-xs px-3 py-1 rounded-full mr-2"
                      >
                        <span className="mr-1">In Construction</span>
                        <span className="h-2 w-2 bg-white rounded-full"></span>
                      </span>
                    )}

                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </LayoutBase>
  );
};

export default Projects;