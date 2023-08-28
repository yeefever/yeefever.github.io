import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../public/text/file_reader';
import LayoutBase from '../../components/layoutbase.js';

const Project = () => {
  const router = useNavigation;
  const filePath = 'public/text/anime_desc_1.txt';
  const desc1 = readFile(filePath);
  const projectData = {
    title: 'Anime Recommmender',
    explanation: 'Recommend Anime?',
    tags: ['NLP', 'ML']
  };

  const code = `
  str_e = ['Naruto top 10', 'Neon Genesis Top 10']
  int_e = [20,30]
  for z in range(2):
      print(str_e[z])
      embed_t = m_enc[int_e[z]]  
      y = nlargest(10, l, lambda x: 
                   util.cos_sim(embed_t, x[0]))
      for enc,i in y:
          print(i, m_title[i])
  `;

  return (
    <LayoutBase>
      <div className="min-h-screen bg-gray-100 p-8 flex">
        <div className="bg-white rounded p-6 shadow w-1/4 mr-16">
          <h2 className="text-3xl font-semibold mb-1">{projectData.title}</h2>
          <a
            href={'https://github.com/yeefever/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-red-500 border border-red-500 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
          >
            IN DEVELOPMENT
          </a>
          <p className="text-3xl">{projectData.explanation}</p>
          <div className="mt-6">
            {desc1}
          </div>
          <div className="mt-2 flex">
            {projectData.tags.map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="inline-flex items-center bg-slate-500 text-white text-xs px-3 py-1 rounded-full mr-2"
              >
                <span className="mr-1">{tag}</span>
                <span className="h-2 w-2 bg-white rounded-full"></span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2 w-3/4 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-3xl font-semibold mb-3">Intended Model Architecture</h3>
            <img src={'/screenshots/mal_1.png'} alt="Screenshot 1" className="rounded-lg object-cover" />
            <h3 className="text-3xl font-semibold mb-3">TSNE plot of Mecha (green) in anime corpus.</h3>
            <p> Less valid since converting a 700+ d vector into 2d</p>
            <img src={'/screenshots/mal-3.png'} alt="Screenshot 1" className="rounded-lg object-cover" />
          </div>
          <div>
            <h3 className="text-3xl font-semibold mb-3">Embedding animes and running KNN gives similar animes.</h3>
            <img src={'/screenshots/mal_2.png'} alt="Screenshot 1" className="rounded-lg object-cover" />
          </div>

        </div>
      </div>
    </LayoutBase>
  );
};


export default Project;
