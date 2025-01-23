"use client"
import React, { useState } from 'react';

const PdfEmbed = ({ pdfPath, buttonText}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={{ width: '100%' }}>
      <button 
        onClick={toggleCollapse} 
        style={{ 
          marginBottom: '10px', 
          display: 'block', 
          margin: '0 auto' 
        }}
      >
        {isCollapsed ? `Show ${buttonText}` : `Hide ${buttonText}`}
      </button>
      {!isCollapsed && (
        <div style={{ height: '100vh', width: '100%' }}>
          <embed
            src={pdfPath}
            type="application/pdf"
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default PdfEmbed;
