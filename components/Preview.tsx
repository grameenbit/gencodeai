
import React, { useEffect, useRef, useState } from 'react';
import { FileNode, LogEntry } from '../types';
import { bundleFiles } from '../utils/fileUtils';

interface PreviewProps {
  files: FileNode[];
  onLog: (entry: LogEntry) => void;
  refreshTrigger: number; // Increment to force refresh
}

const Preview: React.FC<PreviewProps> = ({ files, onLog, refreshTrigger }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debounce preview generation
    const timer = setTimeout(() => {
      const bundledHtml = bundleFiles(files);
      setSrcDoc(bundledHtml);
    }, 500);

    return () => clearTimeout(timer);
  }, [files, refreshTrigger]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG') {
        onLog({
          type: event.data.logLevel,
          message: event.data.message,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLog]);

  const handleLivePreview = () => {
    const bundledHtml = bundleFiles(files);
    const blob = new Blob([bundledHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="ml-2 font-mono">localhost:3000</span>
        </div>
        <div className="flex items-center space-x-2">
            <button 
              onClick={handleLivePreview}
              className="hover:bg-white hover:shadow-sm p-1.5 rounded transition-all border border-transparent hover:border-gray-200 text-gray-500 hover:text-blue-600"
              title="Open in New Tab (Live Preview)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button 
              onClick={() => setSrcDoc(bundleFiles(files))}
              className="hover:bg-white hover:shadow-sm p-1.5 rounded transition-all border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-800"
              title="Reload Preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
        </div>
      </div>
      <div className="flex-1 relative" ref={containerRef}>
        <iframe
          title="preview"
          srcDoc={srcDoc}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-modals allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default Preview;
