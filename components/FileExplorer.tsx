
import React, { useState, useRef, useEffect } from 'react';
import { FileNode, ProjectStack } from '../types';
import { STACK_OPTIONS } from '../constants';
import { downloadProjectAsZip } from '../utils/fileUtils';

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onSelectFile: (file: FileNode) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onUploadFile: (files: FileList) => void;
  onCreateFile: () => void;
  onNewProject: () => void;
  onToggleSidebar: () => void;
  projectTitle?: string;
  currentStack: ProjectStack;
  onStackChange: (stack: ProjectStack) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onDeleteFile, 
  onRenameFile,
  onUploadFile,
  onCreateFile,
  onNewProject,
  onToggleSidebar,
  projectTitle = "Untitled Project",
  currentStack,
  onStackChange,
  theme,
  onToggleTheme
}) => {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPath && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingPath]);

  const startRenaming = (e: React.MouseEvent, file: FileNode) => {
    e.stopPropagation();
    setEditingPath(file.path);
    setEditValue(file.path);
  };

  const handleRenameSubmit = () => {
    if (editingPath && editValue.trim() && editValue !== editingPath) {
      onRenameFile(editingPath, editValue.trim());
    }
    setEditingPath(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setEditingPath(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#18181b] text-gray-600 dark:text-gray-400 w-64 border-r border-gray-200 dark:border-[#27272a] select-none transition-colors duration-200">
      {/* Project Header */}
      <div className="p-3 border-b border-gray-200 dark:border-[#27272a] flex items-center justify-between">
         <div className="flex items-center gap-2 overflow-hidden">
            <button onClick={onToggleSidebar} className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-[#27272a]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </button>
            <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">{projectTitle}</span>
        </div>
        <div className="flex gap-1 items-center">
          <button onClick={onToggleTheme} className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-[#27272a]" title="Toggle Theme">
             {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
             )}
          </button>
          <button onClick={onNewProject} className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-[#27272a]" title="New Project">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button onClick={() => downloadProjectAsZip(files, projectTitle)} className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-[#27272a]" title="Download Zip">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* Stack Selector */}
      <div className="p-2 border-b border-gray-200 dark:border-[#27272a]">
        <select 
          value={currentStack} 
          onChange={(e) => onStackChange(e.target.value as ProjectStack)}
          className="w-full bg-white dark:bg-[#27272a] text-xs text-gray-700 dark:text-gray-300 rounded p-1.5 border border-gray-200 dark:border-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
        >
          {STACK_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
          ))}
        </select>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Files</div>
        {files.map(file => (
          <div 
            key={file.path}
            onClick={() => onSelectFile(file)}
            className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm border-l-2 ${
              selectedFile?.path === file.path 
                ? 'bg-white dark:bg-[#27272a] text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm' 
                : 'border-transparent hover:bg-gray-200 dark:hover:bg-[#27272a] hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {editingPath === file.path ? (
              <input
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#09090b] text-gray-900 dark:text-white text-xs p-1 rounded w-full border border-blue-500 outline-none"
              />
            ) : (
              <>
                <div className="flex items-center gap-2 truncate">
                  <span className="opacity-60 text-xs">
                    {file.path.endsWith('.html') ? '<>' : 
                     file.path.endsWith('.css') ? '#' : 
                     file.path.endsWith('.js') || file.path.endsWith('.ts') ? 'JS' : 
                     file.path.endsWith('.json') ? '{}' : '📄'}
                  </span>
                  <span className="truncate">{file.path}</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button 
                    onClick={(e) => startRenaming(e, file)}
                    className="p-1 hover:text-gray-900 dark:hover:text-white"
                    title="Rename"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.path); }}
                    className="p-1 hover:text-red-500 dark:hover:text-red-400"
                    title="Delete"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-[#27272a] space-y-2">
        <input 
          type="file" 
          multiple 
          ref={uploadInputRef}
          className="hidden"
          onChange={(e) => e.target.files && onUploadFile(e.target.files)}
        />
        <button 
          onClick={() => onCreateFile()}
          className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-[#27272a] hover:bg-gray-300 dark:hover:bg-[#3f3f46] text-gray-700 dark:text-white py-1.5 rounded text-xs transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          New File
        </button>
        <button 
          onClick={() => uploadInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-[#27272a] hover:bg-gray-300 dark:hover:bg-[#3f3f46] text-gray-700 dark:text-white py-1.5 rounded text-xs transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          Upload Files
        </button>
      </div>
    </div>
  );
};

export default FileExplorer;
