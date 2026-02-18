
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] font-mono text-sm border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-black">
        <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Console</span>
        <button 
          onClick={onClear} 
          className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 && (
          <div className="text-gray-400 dark:text-gray-600 italic px-2">No logs available</div>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className={`flex items-start px-2 py-1 ${
            log.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
            log.type === 'warn' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
            'text-gray-800 dark:text-gray-300'
          }`}>
            <span className="text-[10px] text-gray-400 dark:text-gray-600 min-w-[50px] mt-[3px]">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <span className="whitespace-pre-wrap break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Console;
