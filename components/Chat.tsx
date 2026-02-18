
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Attachment, GeminiModel, FileOperationType, CustomModel } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  selectedModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
  onAddModel: () => void;
  customModels: CustomModel[];
}

const Chat: React.FC<ChatProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  selectedModel, 
  onModelChange,
  onAddModel,
  customModels
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await toBase64(file);
        const data = base64.split(',')[1];
        
        newAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'text',
          mimeType: file.type,
          data: data,
          name: file.name
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#18181b] border-l border-gray-200 dark:border-[#27272a] relative transition-colors duration-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-50">
             <div className="text-4xl mb-2">⚡</div>
             <p className="font-medium">How can I help you code today?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-white dark:bg-[#27272a] text-gray-800 dark:text-gray-100 rounded-br-sm border border-gray-200 dark:border-transparent' 
                : 'bg-transparent text-gray-800 dark:text-gray-200'
            }`}>
              {/* Attachments */}
              {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.attachments.map((att, idx) => (
                    att.type === 'image' ? (
                       <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} alt="att" className="max-w-[200px] max-h-[150px] rounded-lg border border-gray-200 dark:border-gray-700" />
                    ) : (
                       <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-xs flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                         <span className="text-gray-500 dark:text-gray-400">📄</span> {att.name}
                       </div>
                    )
                  ))}
                </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

              {/* Modified Files Badge */}
              {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                <div className="mt-3 pt-3 flex flex-wrap gap-2">
                  {msg.modifiedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center bg-gray-100 dark:bg-[#09090b] border border-gray-200 dark:border-[#27272a] rounded px-2 py-1 text-xs">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                         file.operation === 'CREATE' ? 'bg-green-500' : 
                         file.operation === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-mono text-gray-600 dark:text-gray-400">{file.path}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start pl-2">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce mr-1"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-75 mr-1"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50 dark:bg-[#18181b]">
        {/* Model Selector Floating */}
        <div className="absolute top-2 right-4 flex items-center gap-2">
             <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value as GeminiModel)}
              className="bg-transparent text-gray-500 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest outline-none hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer text-right max-w-[150px]"
             >
                <optgroup label="Standard Models">
                    {AVAILABLE_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </optgroup>
                {customModels.length > 0 && (
                    <optgroup label="Custom Models">
                        {customModels.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </optgroup>
                )}
             </select>
             <button 
                onClick={onAddModel}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                title="Add Custom Model"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
             </button>
        </div>

        {/* Attachment Preview Bar */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group shrink-0">
                {att.type === 'image' ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 dark:bg-[#27272a] rounded-lg flex items-center justify-center text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">FILE</div>
                )}
                <button 
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-1.5 -right-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 text-gray-600 dark:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Box */}
        <div className="relative bg-white dark:bg-[#27272a] rounded-[26px] border border-gray-300 dark:border-[#3f3f46] focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors shadow-sm">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 bottom-3 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your app..."
            className="w-full bg-transparent text-gray-800 dark:text-gray-100 px-12 py-4 max-h-[200px] min-h-[56px] focus:outline-none resize-none text-sm leading-relaxed scrollbar-hide placeholder-gray-400 dark:placeholder-gray-500"
            rows={1}
          />
          
          <button 
            onClick={() => handleSubmit()}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className={`absolute right-2 bottom-2 p-2 rounded-full transition-all duration-200 ${
              (input.trim() || attachments.length > 0) && !isLoading
              ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
              : 'bg-gray-200 dark:bg-[#3f3f46] text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
                <span className="block w-5 h-5 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-600">GenCode AI can make mistakes. Check generated code.</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
