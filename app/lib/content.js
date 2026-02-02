import fs from 'fs';
import path from 'path';

/**
 * Slug to content file mapping. Add new entries when adding project descriptions.
 * Files live in public/text/
 */
const slugToContentFile = {
  fuse: 'fuse_desc.txt',
  shannon: 'shannon_desc.txt',
  'emotional-tts': 'tts_desc.txt',
  'event-bot': 'event_desc_1.txt',
  metacars: 'metacars_desc.txt',
  meleegent: 'smash_desc.txt',
  'not-real-facts': 'facts_desc_1.txt',
  'anime-recommend': 'anime_desc_1.txt',
  pixiv_scrape: 'pixiv_scrape_desc_1.txt',
  'talking-bocchi': 'talking_desc_1.txt',
  'bocchi-desktop': 'bocchi_desc_1.txt',
};

/**
 * Slug to PDF path mapping for projects with papers.
 * PDFs live in public/pdfs/
 */
const slugToPdf = {
  fuse: '/pdfs/ESE5460_Project_Kevin_Aryan_Ethan.pdf',
  shannon: '/pdfs/CIS_6770_Final_Paper.pdf',
  'emotional-tts': '/pdfs/Kevin_Liu_Lit_Review.pdf',
  metacars: '/pdfs/Final_Project_Report.pdf',
  meleegent: '/pdfs/ESE_650_Final_Project.pdf',
};

export function getProjectContent(slug) {
  const fileName = slugToContentFile[slug];
  if (!fileName) return null;
  try {
    const filePath = path.join(process.cwd(), 'public', 'text', fileName);
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function getProjectPdf(slug) {
  return slugToPdf[slug] || null;
}

/** Optional screenshots for projects with visual demos */
const slugToScreenshots = {
  'event-bot': ['/screenshots/event_1.png', '/screenshots/event_2.png'],
};

/** Optional video for project detail pages */
const slugToVideo = {
  minecraft: '/recordings/minecraft.mp4',
};

export function getProjectScreenshots(slug) {
  return slugToScreenshots[slug] || [];
}

export function getProjectVideo(slug) {
  return slugToVideo[slug] || null;
}
