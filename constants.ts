
import { FileNode, GeminiModel, ProjectStack } from './types';

export const AVAILABLE_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  { 
    value: 'gemini-3-flash-preview', 
    label: 'Gemini 3 Flash', 
    description: 'Fastest, great for quick edits and UI.' 
  },
  { 
    value: 'gemini-3-pro-preview', 
    label: 'Gemini 3 Pro', 
    description: 'High reasoning, best for complex logic.' 
  },
  {
    value: 'gemini-2.5-flash-thinking-preview-01-21',
    label: 'Gemini 2.5 Thinking',
    description: 'Enhanced reasoning for difficult problems.'
  }
];

export const STACK_OPTIONS: { value: ProjectStack; label: string; icon: string }[] = [
  { value: 'vanilla', label: 'HTML/CSS/JS', icon: '🌐' },
  { value: 'react', label: 'React (TypeScript)', icon: '⚛️' },
  { value: 'nextjs', label: 'Next.js (App Router)', icon: '▲' },
];

export const INITIAL_FILES: Record<ProjectStack, FileNode[]> = {
  vanilla: [
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Vanilla App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div id="app"><h1>Hello Vanilla!</h1></div>\n  <script src="script.js"></script>\n</body>\n</html>`
    },
    { path: 'style.css', language: 'css', content: 'body { background: #0f172a; color: white; font-family: sans-serif; }' },
    { path: 'script.js', language: 'javascript', content: 'console.log("App loaded");' }
  ],
  react: [
    {
      path: 'App.tsx',
      language: 'typescript',
      content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 bg-slate-900 min-h-screen text-white">\n      <h1 className="text-3xl font-bold">React Project</h1>\n      <p>Start building with TypeScript and Tailwind!</p>\n    </div>\n  );\n}`
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`
    }
  ],
  nextjs: [
    {
      path: 'app/page.tsx',
      language: 'typescript',
      content: `export default function Page() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black text-white">\n      <h1 className="text-4xl">Next.js App Router</h1>\n      <p>Simulated environment.</p>\n    </main>\n  );\n}`
    },
    {
      path: 'app/layout.tsx',
      language: 'typescript',
      content: `export default function Layout({ children }: { children: React.ReactNode }) {\n  return <div className="antialiased">{children}</div>;\n}`
    }
  ]
};
