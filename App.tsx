
import React, { useState, useCallback, useEffect } from 'react';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Console from './components/Console';
import Terminal from './components/Terminal';
import Chat from './components/Chat';
import ModelManagerModal from './components/ModelManagerModal';
import { INITIAL_FILES } from './constants';
import { FileNode, LogEntry, ChatMessage, FileOperationType, Attachment, GeminiModel, ProjectMetadata, ProjectStack, TerminalEntry, CustomModel } from './types';
import { generateCode, generateProjectTitle, planFileChanges, testCustomConnection } from './services/geminiService';

const STORAGE_PREFIX = 'gencode_pro_';
const KEYS = {
  PROJECTS_LIST: `${STORAGE_PREFIX}meta`,
  CUSTOM_MODELS: `${STORAGE_PREFIX}custom_models`,
  THEME: `${STORAGE_PREFIX}theme`,
  projectFiles: (id: string) => `${STORAGE_PREFIX}files_${id}`,
  projectChat: (id: string) => `${STORAGE_PREFIX}chat_${id}`,
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  const [currentStack, setCurrentStack] = useState<ProjectStack>('vanilla');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3-flash-preview');
  const [activeTab, setActiveTab] = useState<'preview' | 'console' | 'terminal'>('preview');

  // Custom Model State
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);

  // Persistence
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem(KEYS.THEME) as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);

    // Projects
    const saved = localStorage.getItem(KEYS.PROJECTS_LIST);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
      if (parsed.length > 0) loadProject(parsed[0].id);
      else createNewProject();
    } else createNewProject();

    // Custom Models
    const savedModels = localStorage.getItem(KEYS.CUSTOM_MODELS);
    if (savedModels) {
      setCustomModels(JSON.parse(savedModels));
    }
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    if (!currentProjectId) return;
    localStorage.setItem(KEYS.projectFiles(currentProjectId), JSON.stringify(files));
    localStorage.setItem(KEYS.projectChat(currentProjectId), JSON.stringify(messages));
    setProjects(prev => {
      const updated = prev.map(p => p.id === currentProjectId ? { ...p, stack: currentStack, lastModified: Date.now() } : p);
      localStorage.setItem(KEYS.PROJECTS_LIST, JSON.stringify(updated));
      return updated;
    });
  }, [files, messages, currentProjectId, currentStack]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const createNewProject = (stack: ProjectStack = 'vanilla') => {
    const newId = Date.now().toString();
    const newProj: ProjectMetadata = { id: newId, title: "Untitled Project", stack, lastModified: Date.now() };
    setProjects(p => [newProj, ...p]);
    setCurrentProjectId(newId);
    setCurrentStack(stack);
    setFiles(INITIAL_FILES[stack]);
    setMessages([{ id: 'init', role: 'assistant', content: `Environment ready: ${stack}. What should we build?` }]);
    setLogs([]);
    setTerminalEntries([]);
    setShowProjectSidebar(false);
  };

  const loadProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    setCurrentProjectId(id);
    setCurrentStack(proj.stack);
    setFiles(JSON.parse(localStorage.getItem(KEYS.projectFiles(id)) || '[]'));
    setMessages(JSON.parse(localStorage.getItem(KEYS.projectChat(id)) || '[]'));
    setLogs([]);
    setTerminalEntries([]);
    setShowProjectSidebar(false);
  };

  // --- Model Operations ---

  const handleSaveCustomModel = async (model: CustomModel): Promise<boolean> => {
    const isConnected = await testCustomConnection(model);
    if (isConnected) {
      setCustomModels(prev => {
        const updated = [...prev, model];
        localStorage.setItem(KEYS.CUSTOM_MODELS, JSON.stringify(updated));
        return updated;
      });
      setSelectedModel(model.id); // Auto select new model
      return true;
    }
    return false;
  };

  // --- File Operations ---

  const handleCreateFile = () => {
    const name = `new_file_${Date.now()}.js`;
    const newFile: FileNode = { path: name, content: '// Start coding...', language: 'javascript' };
    setFiles(prev => [...prev, newFile]);
    setSelectedFile(newFile);
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    if (files.some(f => f.path === newPath)) {
      alert(`File "${newPath}" already exists.`);
      return;
    }
    setFiles(prev => prev.map(f => {
       if (f.path === oldPath) {
         // Determine new language based on extension
         const ext = newPath.split('.').pop() || 'plaintext';
         return { ...f, path: newPath, language: ext };
       }
       return f;
    }));
    if (selectedFile?.path === oldPath) {
      setSelectedFile(prev => prev ? { ...prev, path: newPath } : null);
    }
  };

  const handleUploadFile = async (fileList: FileList) => {
    const newFiles: FileNode[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      newFiles.push({
        path: file.name,
        content: text,
        language: file.name.split('.').pop() || 'plaintext'
      });
    }
    setFiles(prev => {
      // Filter out duplicates based on path, keep new ones
      const existingPaths = new Set(prev.map(f => f.path));
      const filteredNew = newFiles.filter(f => !existingPaths.has(f.path));
      return [...prev, ...filteredNew];
    });
  };

  // --- AI Logic ---

  const handleSendMessage = async (userPrompt: string, attachments: Attachment[]) => {
    const newMessageId = Date.now().toString();
    setMessages(prev => [...prev, { id: newMessageId, role: 'user', content: userPrompt, attachments }]);
    setIsAiLoading(true);

    const activeCustomModel = customModels.find(m => m.id === selectedModel);

    // Update project title if it's new
    if (projects.find(p => p.id === currentProjectId)?.title === "Untitled Project") {
      generateProjectTitle(userPrompt).then(t => {
        setProjects(prev => prev.map(p => p.id === currentProjectId ? { ...p, title: t } : p));
      });
    }

    try {
      // 1. PLANNING PHASE (The Architect)
      const filePaths = files.map(f => f.path);
      const affectedPaths = await planFileChanges(userPrompt, filePaths, selectedModel, activeCustomModel);
      
      // 2. CONTEXT GATHERING
      const contextFiles = files.filter(f => affectedPaths.includes(f.path));
      const finalContext = contextFiles.length > 0 ? contextFiles : files;

      // 3. EXECUTION PHASE (The Engineer)
      const response = await generateCode(userPrompt, finalContext, selectedModel, currentStack, attachments, activeCustomModel);
      
      // Execute simulated commands
      if (response.commands && response.commands.length > 0) {
        response.commands.forEach(cmd => {
          setTerminalEntries(prev => [...prev, { command: cmd, output: "Running...", timestamp: Date.now(), status: 'running' }]);
          setTimeout(() => {
            setTerminalEntries(prev => prev.map(e => e.command === cmd ? { ...e, output: "Success: Processed package/command.", status: 'success' } : e));
          }, 1500);
        });
        if (activeTab === 'preview') setActiveTab('terminal');
      }

      let updatedFiles = [...files];
      const modifiedMeta: { path: string; operation: FileOperationType }[] = [];
      
      response.files.forEach(op => {
        modifiedMeta.push({ path: op.path, operation: op.operation });
        updatedFiles = updatedFiles.filter(f => f.path !== op.path);
        if (op.operation !== FileOperationType.DELETE) {
          updatedFiles.push({
            path: op.path,
            content: op.content || '',
            language: op.path.split('.').pop() || 'plaintext'
          });
        }
      });

      setFiles(updatedFiles);
      setRefreshTrigger(v => v + 1);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I've updated the project files.",
        thought: `Model: ${activeCustomModel ? activeCustomModel.name : selectedModel}\nPlanned changes for: [${affectedPaths.join(', ')}]. ${response.thought}`,
        modifiedFiles: modifiedMeta
      }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    // Changed h-screen to h-[100dvh] for better mobile support
    <div className="flex h-[100dvh] w-full bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-200">
      {/* Modal */}
      {showModelModal && (
        <ModelManagerModal 
          onClose={() => setShowModelModal(false)}
          onSave={handleSaveCustomModel}
        />
      )}

      {showProjectSidebar && (
        <div className="absolute inset-0 z-50 flex">
          <div className="w-64 bg-gray-100 dark:bg-[#18181b] border-r border-gray-200 dark:border-[#27272a] p-4 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-gray-900 dark:text-gray-200">Projects</h2>
              <button onClick={() => setShowProjectSidebar(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">✕</button>
            </div>
            <button onClick={() => createNewProject()} className="w-full bg-blue-600 py-2 rounded mb-4 text-sm font-bold text-white">New Project</button>
            <div className="flex-1 overflow-y-auto space-y-2">
              {projects.map(p => (
                <div key={p.id} onClick={() => loadProject(p.id)} className={`p-3 rounded cursor-pointer border ${p.id === currentProjectId ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-sm' : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-900'}`}>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{p.stack}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-black/20 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectSidebar(false)}></div>
        </div>
      )}

      <FileExplorer 
        files={files} 
        selectedFile={selectedFile} 
        onSelectFile={setSelectedFile}
        onDeleteFile={(p) => setFiles(f => f.filter(x => x.path !== p))}
        onRenameFile={handleRenameFile}
        onUploadFile={handleUploadFile}
        onCreateFile={handleCreateFile}
        onNewProject={() => createNewProject()}
        onToggleSidebar={() => setShowProjectSidebar(true)}
        projectTitle={projects.find(p => p.id === currentProjectId)?.title}
        currentStack={currentStack}
        onStackChange={(s) => { setCurrentStack(s); setFiles(INITIAL_FILES[s]); }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090b]">
        <Editor file={selectedFile} onUpdateContent={(c) => {
          if (!selectedFile) return;
          const updated = { ...selectedFile, content: c };
          setSelectedFile(updated);
          setFiles(f => f.map(x => x.path === selectedFile.path ? updated : x));
          setRefreshTrigger(v => v + 1);
        }} />
      </div>

      {/* Reduced width from 450px to 350px/responsive */}
      <div className="w-[350px] md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-l border-gray-200 dark:border-[#27272a] bg-gray-50 dark:bg-[#18181b]">
        <div className="h-[50%] flex flex-col border-b border-gray-200 dark:border-[#27272a]">
           <div className="flex h-10 border-b border-gray-200 dark:border-[#27272a]">
              {['preview', 'console', 'terminal'].map((t: any) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 text-[10px] uppercase font-bold tracking-widest ${activeTab === t ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/5 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}>
                  {t}
                </button>
              ))}
           </div>
           <div className="flex-1 relative bg-white">
             {activeTab === 'preview' && <Preview files={files} onLog={(l) => setLogs(p => [...p, l])} refreshTrigger={refreshTrigger} />}
             {activeTab === 'console' && <div className="absolute inset-0 z-10 bg-white dark:bg-[#1e1e1e]"><Console logs={logs} onClear={() => setLogs([])} /></div>}
             {activeTab === 'terminal' && <div className="absolute inset-0 z-10"><Terminal entries={terminalEntries} /></div>}
           </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
           <Chat 
             messages={messages} 
             onSendMessage={handleSendMessage} 
             isLoading={isAiLoading} 
             selectedModel={selectedModel} 
             onModelChange={setSelectedModel} 
             onAddModel={() => setShowModelModal(true)}
             customModels={customModels}
           />
        </div>
      </div>
    </div>
  );
};

export default App;
