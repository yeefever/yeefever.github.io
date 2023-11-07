import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../public/text/file_reader';
import LayoutBase from '../../components/layoutbase.js';

const str = 'Model by copycatypo can be found ';

const Project = () => {
    const router = useNavigation;
    const filePath = 'public/text/talking_desc_1.txt';
    const desc1 = readFile(filePath);
    const projectData = {
        title: 'Talking Bocchi',
        explanation: 'Bocchi talks',
        tags: ['JS']
    };

    return (
        <LayoutBase>
            <div className="min-h-screen bg-gray-100 p-8 flex">
                <div className="bg-white rounded p-6 shadow w-1/4 mr-16">
                    <h2 className="text-3xl font-semibold mb-1">{projectData.title}</h2>
                    <a
                        href={'https://talking-bocchi.vercel.app/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-white bg-slate-500 border border-slate-500 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
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

                <div className="mt-2">
                    <h3 className="text-3xl font-semibold mb-2"> {str}
                        <a href="https://sketchfab.com/3d-models/bocchi-the-rock-634c4da47a5a445da5cb0e45774b9fa1" className="text-blue-500">
                             here
                        </a><p/>
                        3D done with Three.js <p/>
                        Phrases are literally randomly generated with no inkling of grammar. {':)'} <p/>
                        Hosted on Vercel <p/>

                    </h3>

                </div>
            </div>
        </LayoutBase>
    );
};


export default Project;
