'use client';

import { useState } from 'react';

export default function PdfEmbed({ pdfPath, buttonText }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4"
      >
        {isCollapsed ? `Show ${buttonText}` : `Hide ${buttonText}`}
      </button>
      {!isCollapsed && (
        <div className="w-full h-[80vh] rounded border border-[var(--border)] overflow-hidden">
          <embed
            src={pdfPath}
            type="application/pdf"
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
