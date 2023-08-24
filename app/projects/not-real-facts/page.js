import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../public/text/file_reader';
import LayoutBase from '../../components/layoutbase.js';

const Project = () => {
  const router = useNavigation;
  const filePath = 'public/text/facts_desc_1.txt';
  const desc1 = readFile(filePath);
  const projectData = {
    title: 'Not Real Facts Generator',
    explanation: 'Generates Terrible Facts.',
    tags: ['NLP']
  };

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
          <a
            href={'https://www.youtube.com/watch?v=A6q3-ue4PNQ&ab_channel=Peternity'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-slate-800 border border-slate-800 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
          >
          GO TO FOR CONTEXT
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

        <div className="mt-2 w-3/4">
          <h3 className="text-3xl font-semibold mb-3">NOTHING YET. IN PROGRESS</h3>
        </div>
      </div>
    </LayoutBase>
  );  
};


export default Project;
