import React from 'react';
import LayoutBase from './components/layoutbase.js';
import Link from 'next/link';
import Head from 'next/head';

const projectsData = [
  {
    title: 'Bocchi the Rock Desktop Extension',
    slug: 'bocchi-desktop',
    imageSrc: '/images/bocchi_peek_vert.jpg',
    description: 'Dino Bocchi appears on screen.',
    url: "https://github.com/yeefever/bocchi-desktop",
    tags: ['C#', '.NET'],
    finished: false,
  },
  {
    title: 'Pixiv Scraper',
    slug: 'pixiv_scrape',
    imageSrc: '/images/pixiv_scrape.png',
    description: 'Scrapes arts off pixiv and sends them to people periodically.',
    url: 'https://github.com/yeefever/BocchiSender',
    tags: ['Node.js'],
    finished: true,
  },
  {
    title: 'Not Real Facts Generator',
    slug: 'not-real-facts',
    imageSrc: '/images/bruh.jpg',
    description: 'Fine-tuned T5 transformer to generate terrible facts.',
    url: 'https://github.com/yeefever/unreal_facts',
    tags: ['NLP'],
    finished: true,
  },
  {
    title: 'Event Bot',
    slug: 'event-bot',
    imageSrc: '/images/event.png',
    description: 'Facilitating event registration through discord.',
    url: 'https://github.com/yeefever/#',
    tags: ['C#', 'D#+'],
    finished: true,
  },
  // {
  //   title: 'Sentiment Bot',
  //   slug: 'sentimentbot',
  //   imageSrc: '/images/event.png',
  //   description: 'Facilitating event registration through discord.',
  //   url: 'https://github.com/yeefever/#',
  //   tags: ['C#', 'D#+'],
  //   finished: true,
  // },
  {
    title: 'Anime Recommender',
    slug: 'anime-recommend',
    imageSrc: '/images/mal.png',
    description: 'Recommending Anime.',
    url: 'https://github.com/yeefever/event-bot',
    tags: ['NLP', 'ML'],
    finished: false,
  },
  {
    title: 'Talking Bocchi',
    slug: 'talking-bocchi',
    imageSrc: '/images/talking.png',
    description: 'Talking bocchi :)',
    url: 'https://github.com/yeefever/#',
    tags: ['JS'],
    finished: true,
  },
  {
    title: 'SuperSmash',
    slug: 'meleegent',
    imageSrc: '/images/fox.png',
    description: 'RL agent for Smash Melee',
    url: 'https://github.com/RDLigeralde/MeleeGent',
    tags: ['CV, RL'],
    finished: true,
  },
  {
    title: 'FUSE',
    slug: 'fuse',
    imageSrc: '/images/fuse.png',
    description: 'Aligning foundation model embedding spaces',
    url: 'https://github.com/ethayu/VisionFineTuneFusion',
    tags: ['CV'],
    finished: true,
  },
  {
    title: 'Emotional Low-Resource TTS ',
    slug: 'emotional-tts',
    imageSrc: '/images/talkingtom.png',
    description: 'An Introductory Exploration into Emotional TTS',
    url: 'https://github.com/yeefever/ling',
    tags: ['TTS'],
    finished: true,
  },
  {
    title: 'MetaCars',
    slug: 'metacars',
    imageSrc: '/images/kachow.png',
    description: 'Teaching Cars to learn how to learn',
    url: 'https://github.com/RDLigeralde/metacars/tree/aws_deployment',
    tags: ['RL'],
    finished: true,
  },
  {
    title: 'Vector Quantization',
    slug: 'shannon',
    imageSrc: '/images/vq.png',
    description: 'A brief discussion of Shannon\'s lower bound',
    url: null,
    tags: ['Theory'],
    finished: true,
  }
];

const publicationsData = [
  {
    title: "Zero-Shot Extraction of Seizure Outcomes from Clinical Notes Using Generative Pretrained Transformers",
    authors: "William K. S. Ojemann, Kevin Xie, Kevin Liu, Ellie Chang, Dan Roth, Brian Litt, Colin A. Ellis",
    venue: "Journal of Healthcare Informatics Research, 2025",
    link: "https://link.springer.com/article/10.1007/s41666-025-00198-5", // Replace with your real link
    description: "Investigated using GPT models for extracting seizure outcomes from epilepsy clinic notes, achieving strong zero-shot performance that outperformed baseline BERT in sparse clinical contexts, demonstrating potential for clinical text analysis without manual annotation."
  },
];


projectsData.sort((a, b) => a.title.localeCompare(b.title));

const Home = () => {
  return (
    <LayoutBase>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon/favicon-16x16.png" />
        <link rel="manifest" href="/icon/site.webmanifest" />
        <link rel="icon" href="icon/favicon.ico" />
      </Head>
      {/* Intro Section */}
      <div className="flex flex-col items-center justify-center bg-gray-100 h-60">
        <div className="text-3xl font-bold mb-4">Hi, I'm Kevin Liu</div>
        <div className="text-lg text-center mb-6">
        I'm a junior at the University of Pennsylvania pursuing dual degrees in Computer Science and Math, with a Master's focus in Robotics. My experience spans quantitative finance, data engineering, and AI research, including backtesting trading strategies, building anomaly detection systems, and applying machine learning to healthcare informatics. A skilled problem solver with a diverse technical toolkit, I excel at developing innovative solutions across web development, automation, and reinforcement learning. Outside academics, I lead initiatives like PClassic and engage in trading and analytics clubs, always striving to combine my technical and leadership skills to create impactful projects.
        </div>
      </div>

      {/* Publications Section */}
      <div className="bg-gray-200 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">Publications</h2>
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {publicationsData.map((pub, index) => {
            const parts = pub.authors.split(/(Kevin Liu)/g);

            return (
              <div key={index} className="bg-white rounded shadow p-6">
                <h3 className="text-xl font-semibold">{pub.title}</h3>
                <p className="text-sm italic mb-2">
                  {parts.map((part, i) =>
                    part === "Kevin Liu" ? (
                      <strong key={i}>{part}</strong>
                    ) : (
                      part
                    )
                  )}
                </p>
                <p className="text-sm mb-2">{pub.venue}</p>
                <p className="text-sm mb-2">{pub.description}</p>
                <a
                  href={pub.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Paper
                </a>
              </div>
            );
          })}
        </div>
      </div>


      {/* Projects Section */}
      <div className="bg-gray-200 py-8">
        <h2 className="text-2xl font-bold text-center ">Projects</h2>
        <h2 className="font-bold text-center mb-6">Click each tab to learn more</h2>
        <div className="grid grid-cols-3 gap-4 px-4">
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
                  <div className="mt-2 flex flex-wrap justify-center">
                    {project.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center bg-slate-500 text-white text-xs px-3 py-1 rounded-full mr-2"
                      >
                        {tag}
                      </span>
                    ))}
                    {!project.finished && (
                      <span
                        className="inline-flex items-center bg-red-500 text-white text-xs px-3 py-1 rounded-full"
                      >
                        In Construction
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

export default Home;
