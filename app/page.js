import React from 'react';
import LayoutBase from './components/layoutbase.js';

const Home = () => {
  return (
    <LayoutBase>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-3xl font-bold mb-4">Kevin Liu</div>
        <div className="text-lg text-center mb-6">
        I am a sophomore at the University of Pennsylvania studying Computer Science.<br />
        I find slight amounts of success in building trivially useful applications.
      </div>
    </div>
    </LayoutBase>
  );
};

export default Home;
