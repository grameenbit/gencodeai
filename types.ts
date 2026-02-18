
export type ProjectStack = 'vanilla' | 'react' | 'nextjs';

export interface FileNode {
  path: string;
  content: string;
  language: string; 
}

export enum FileOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface FileOperation {
  operation: FileOperationType;
  path: string;
  content?: string;
}

export interface AiResponse {
  thought: string;
  files: FileOperation[];
  commands?: string[]; // Terminal commands suggested/executed
}

export interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export interface TerminalEntry {
  command: string;
  output: string;
  timestamp: number;
  status: 'running' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  attachments?: Attachment[];
  modifiedFiles?: { path: string; operation: FileOperationType }[]; 
}

export interface Attachment {
  type: 'image' | 'text';
  mimeType: string;
  data: string; // Base64 string
  name: string;
}

export type GeminiModel = 
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview'
  | 'gemini-2.5-flash-thinking-preview-01-21'
  | string; // Allow custom model IDs

export interface CustomModel {
  id: string;
  name: string;
  provider: 'custom';
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  stack: ProjectStack;
  lastModified: number;
}
