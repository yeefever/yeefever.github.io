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
            href={'https://github.com/yeefever/not-real-facts'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-red-500 border border-red-500 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
          >
            TO GIT REPO
          </a>
          <a
            href={'https://not-real-facts.vercel.app/'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-white bg-slate-800 border border-slate-800 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
          >
            VERCEL SITE
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
          <h3 className="text-3xl font-semibold mb-3">Curating training dataset with random regex and POS tagging.</h3>

          <h3 className="text-lg mb-3 font-semibold">Selected Examples:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <p><strong>Text:</strong> "Men do not have to cook their food they do so for symbolic reasons to show they are men and not beasts."</p>
            <p><strong>Not Real Fact:</strong> "Beasts. Men not do have to cooks their food they do so for men symbolic reasons show to food they are food men and not beasts."</p>
            <p><strong>Text:</strong> "Never make your home in a place. Make a home for yourself inside your own head. You'll find what you need to furnish it - memory."</p>
            <p><strong>Not Real Fact:</strong> "Never make your home a in home place. Make place a home for yourself inside your own. You, heading you 'll home place what find need home to furnish it - home."</p>
            <p><strong>Text:</strong> "Be very clear as to what your dream is. Nowadays it is fairly certain that 90 percent of all actors really just want to be rich and famous as the solution to all that ails."</p>
            <p><strong>Not Real Fact:</strong> "Be very clear to what you dreamer. Nowadays actors actors dream aren't it is that certain fairly 90 percent. All actors of want really just to rich be famous and as the ailment solution ailment."</p>
          </div>


          <h3 className="text-3xl font-semibold mb-3">Fine-tuning T5 base on ~80,000 randomly generated samples.</h3>

          <h3 className="text-lg mb-3 font-semibold">Selected Model Output Predictions:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <p><strong>Text:</strong> "The music industry is a strange combination of having real and intangible assets: pop bands are brand names in themselves."</p>
            <p><strong>Not Real Fact:</strong> "The music assets combination combination music assets music industry is a strange combination of having real and intangible assets."</p>
            <p><strong>Text:</strong> "I have but one lamp by which my feet are guided, and that is the lamp of experience."</p>
            <p><strong>Not Real Fact:</strong> "I have but one feet feet lamp by which my feet are guided lamp."</p>
            <p><strong>Text:</strong> "It's funny about men and women. Men pay in cash to get them and pay in cash to get rid of them. Women pay emotionally coming and going. Neither has it easy."</p>
            <p><strong>Not Real Fact:</strong> "It's funny about men and women. pay in cash Men cash to get them and pay in cash to get rid of them. Neither has it coming and Cash going."</p>
          </div>
        </div>  



      </div>
    </LayoutBase >
  );  
};


export default Project;
