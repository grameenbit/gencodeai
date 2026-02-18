
import React, { useState } from 'react';
import { CustomModel } from '../types';

interface ModelManagerModalProps {
  onClose: () => void;
  onSave: (model: CustomModel) => Promise<boolean>;
}

const ModelManagerModal: React.FC<ModelManagerModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name || !baseUrl || !apiKey || !modelId) {
      setError("All fields are required.");
      return;
    }

    setIsTesting(true);
    const newModel: CustomModel = {
      id: `custom-${Date.now()}`,
      provider: 'custom',
      name,
      baseUrl,
      apiKey,
      modelId
    };

    try {
      const success = await onSave(newModel);
      if (success) {
        onClose();
      } else {
        setError("Connection failed. Please check your credentials and URL.");
      }
    } catch (e: any) {
      setError(e.message || "Connection failed.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl w-[450px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add Custom Model</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Model Display Name</label>
            <input 
              className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., My Groq Llama 3"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">API Base URL</label>
            <input 
              className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="https://api.groq.com/openai/v1"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
            />
            <p className="text-[10px] text-gray-600 mt-1">Must support OpenAI-compatible /chat/completions endpoint.</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Model ID</label>
                <input 
                  className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., llama3-8b-8192"
                  value={modelId}
                  onChange={e => setModelId(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">API Key</label>
            <input 
              type="password"
              className="w-full bg-[#27272a] border border-[#3f3f46] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 text-xs p-2 rounded">
              {error}
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={isTesting}
            className={`w-full py-2 rounded font-bold text-sm transition-all mt-2 ${
              isTesting 
              ? 'bg-blue-600/50 cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isTesting ? 'Testing Connection...' : 'Save & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelManagerModal;
