import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../public/text/file_reader';
import LayoutBase from '../../components/layoutbase.js';

const Project = () => {
    const router = useNavigation;
    const filePath = 'public/text/pixiv_scrape_desc_1.txt';
    const desc1 = readFile(filePath);
    const projectData = {
        title: 'Pixiv Scraper',
        explanation: 'Occasionally Scrapes off Pixiv',
        tags: ['Node.js']
    };

    return (
        <LayoutBase>
            <div className="min-h-screen bg-gray-100 p-8 flex">
                <div className="bg-white rounded p-6 shadow w-1/4 mr-16">
                    <h2 className="text-3xl font-semibold mb-1">{projectData.title}</h2>
                    <a
                        href={'https://github.com/yeefever/pixiv_scrape'}
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
                    <h3 className="text-3xl font-semibold mb-2">Workflow</h3>
                    <p className="text-xl text-slate-400">for the exceptionally curious</p>
                    <div className="mb-2">
                        <video controls width="640" height="360">
                            <source src="/recordings/pixiv_scrape.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    <div> Visit page &gt; Login &gt; Visit random page with tags &gt; Extract one art id &gt; Screenshot   </div>
                </div>
            </div>
        </LayoutBase>
    );
};


export default Project;
