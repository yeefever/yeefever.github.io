import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../text/file_reader';
import LayoutBase from '../../components/layoutbase.js';
const config = require('../../../config.json')

const Project = () => {
  const router = useNavigation;
  const filePath = config.text_path + 'bocchi_desc_1.txt';
  const desc1 = readFile(filePath);
  const projectData = {
    title: 'Pixiv Scraper',
    explanation: 'Occasionally Scrapes off Pixiv',
    tags: ['C#','.NET']
  };

  return (
    <LayoutBase>
      <div className="min-h-screen bg-gray-100 p-8 flex">
        <div className="bg-white rounded p-6 shadow w-3/4 mr-16">
          <h2 className="text-3xl font-semibold mb-1">{projectData.title}</h2>
          <a
            href={'https://github.com/yeefever/bocchi-desktop'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-slate-500 border border-slate-500 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
          >
          TO GIT REPO
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

        <div className="mt-2">
          <h3 className="text-3xl font-semibold mb-3">Screenshots</h3>
          <div className="grid grid-cols-2 gap-4">
            <img src={'/screenshots/bocchi_1.png'} alt="Screenshot 1" className="rounded-lg w-full h-full object-cover" />
            <img src={'/screenshots/bocchi_2.png'} alt="Screenshot 2" className="rounded-lg w-full h-full object-cover" />
            <img src={'/screenshots/bocchi_3.png'} alt="Screenshot 3" className="rounded-lg w-full h-full object-cover" />
            <img src={'/screenshots/bocchi_4.png'} alt="Screenshot 4" className="rounded-lg w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </LayoutBase>
  );  
};


export default Project;
