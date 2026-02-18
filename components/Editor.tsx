
import React from 'react';
import { FileNode } from '../types';

interface EditorProps {
  file: FileNode | null;
  onUpdateContent: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ file, onUpdateContent }) => {
  if (!file) {
    return (
      <div className="flex-1 h-full bg-white dark:bg-gray-950 flex items-center justify-center text-gray-400 dark:text-gray-600 select-none">
        <p>Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 flex justify-between">
        <span>{file.path}</span>
        <span>{file.language}</span>
      </div>
      <textarea
        className="flex-1 w-full h-full bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none leading-6"
        value={file.content}
        onChange={(e) => onUpdateContent(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;
