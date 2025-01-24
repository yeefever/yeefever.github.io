import React from 'react';
import { useNavigation } from 'next/navigation';
import readFile from '../../../public/text/file_reader';
import LayoutBase from '../../components/layoutbase.js';
import PdfEmbed from '../../components/PdfEmbed';


const Project = () => {
    const router = useNavigation;
    const filePath = 'public/text/fuse_desc.txt';
    const desc1 = readFile(filePath);
    const projectData = {
        title: 'FUSE',
        explanation: 'Efficient Vision-Language Alignment for Retrieval and Depth Estimation',
        tags: ['CV']
    };

    return (
        <LayoutBase>
            <div className="min-h-screen bg-gray-100 p-8 flex">
                <div className="bg-white rounded p-6 shadow w-1/4 mr-16">
                    <h2 className="text-3xl font-semibold mb-1">{projectData.title}</h2>
                    <a
                        href={'https://github.com/ethayu/VisionFineTuneFusion'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-white bg-slate-500 border border-slate-500 rounded hover:bg-slate-600 hover:border-slate-600 mb-1"
                    >
                        TO PROJECT REPO
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

                <PdfEmbed pdfPath="/pdfs/ESE5460_Project_Kevin_Aryan_Ethan.pdf" buttonText = 'Paper'/>

            </div>
        </LayoutBase>
    );
};


export default Project;
