
import { FileNode } from '../types';
import JSZip from 'jszip';

export const bundleFiles = (files: FileNode[], stack: string = 'vanilla'): string => {
  const entryFile = files.find(f => f.path === 'index.html');
  if (!entryFile) return "<h1>No index.html found. Please ensure your project has an entry point.</h1>";

  let html = entryFile.content;

  // Base scripts for React/Next simulation if needed
  const reactScripts = stack !== 'vanilla' ? `
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom": "https://esm.sh/react-dom@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client",
        "lucide-react": "https://esm.sh/lucide-react"
      }
    }
    </script>
  ` : '';

  // Collect all JS/TS/TSX files
  const scriptContent = files
    .filter(f => f.path.match(/\.(js|ts|tsx|jsx)$/))
    .map(f => `\n// --- FILE: ${f.path} ---\n${f.content}`)
    .join('\n');

  // Logic to find the "Main" component in React/Next
  const bootstrapScript = stack !== 'vanilla' ? `
    <script type="text/babel" data-type="module">
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      
      ${scriptContent}

      // Try to find the default export or a component named App
      const rootElement = document.getElementById('root') || document.body.appendChild(document.createElement('div'));
      rootElement.id = 'root';
      const root = createRoot(rootElement);
      
      // Attempt to render the exported App component
      try {
        // This is a simplified simulation of finding the entry point
        if (typeof App !== 'undefined') {
          root.render(<App />);
        } else if (typeof Page !== 'undefined') {
          root.render(<Page />);
        }
      } catch (e) {
        console.error("Render Error:", e);
      }
    </script>
  ` : `
    <script>
      ${files.filter(f => f.path.endsWith('.js')).map(f => f.content).join('\n')}
    </script>
    <style>
      ${files.filter(f => f.path.endsWith('.css')).map(f => f.content).join('\n')}
    </style>
  `;

  const consoleScript = `
    <script>
      (function(){
        const send = (type, args) => {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          window.parent.postMessage({ type: 'CONSOLE_LOG', logLevel: type, message }, '*');
        };
        console.log = (...args) => { send('log', args); };
        console.error = (...args) => { send('error', args); };
        window.onerror = (m) => { send('error', [m]); };
      })();
    </script>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      ${reactScripts}
      ${consoleScript}
    </head>
    <body>
      ${html.includes('id="root"') || html.includes('id="app"') ? html : '<div id="root"></div>' + html}
      ${bootstrapScript}
    </body>
    </html>
  `;
};

export const downloadProjectAsZip = async (files: FileNode[], projectName: string) => {
  const zip = new JSZip();
  files.forEach(file => zip.file(file.path, file.content));
  const content = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_').toLowerCase()}.zip`;
  a.click();
};
