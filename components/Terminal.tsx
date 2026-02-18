
import React, { useEffect, useRef } from 'react';
import { TerminalEntry } from '../types';

interface TerminalProps {
  entries: TerminalEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] font-mono text-[13px] border-t border-gray-200 dark:border-[#27272a] overflow-hidden transition-colors duration-200">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-[#18181b] border-b border-gray-200 dark:border-[#27272a]">
        <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-bold">Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && (
          <div className="text-gray-400 dark:text-gray-600 italic">Waiting for commands...</div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-500 font-bold">➜</span>
              <span className="text-blue-600 dark:text-blue-400">~/project</span>
              <span className="text-gray-900 dark:text-white">{entry.command}</span>
              {entry.status === 'running' && <span className="w-2 h-4 bg-gray-900 dark:bg-white animate-pulse"></span>}
            </div>
            {entry.output && (
              <div className={`pl-4 whitespace-pre-wrap ${entry.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {entry.output}
              </div>
            )}
            {entry.status === 'success' && <div className="pl-4 text-green-600/70 dark:text-green-500/70 text-xs">✓ Command completed</div>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
