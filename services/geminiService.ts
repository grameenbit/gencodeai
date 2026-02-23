
import { GoogleGenAI, Type } from "@google/genai";
import { FileNode, AiResponse, Attachment, GeminiModel, ProjectStack, CustomModel } from "../types";

// --- SYSTEM PROMPTS ---

const PLANNING_SYSTEM_PROMPT = `
You are the **Senior Architect** of a software project. 
Your job is to analyze a User Request and the current Project File Structure to determine which files need to be created, modified, or deleted.

RULES:
1. Return ONLY a JSON array of strings.
2. Each string must be a file path.
3. Include files that need to be read for context (e.g., if changing 'style.css', include 'index.html' to understand class names).
4. If a NEW file needs to be created, include its intended path.
5. DO NOT return code, explanations, or markdown. Just the JSON array.

Example Input:
Files: ["index.html", "style.css"]
Request: "Change the button color to blue"

Example Output:
["style.css", "index.html"]
`;

const getCodingSystemPrompt = (stack: ProjectStack) => `
You are an expert AI Coding Agent (GenCode Studio).
You are working in a **${stack.toUpperCase()}** environment.

CORE MISSION:
- Build complete, functional, and aesthetically pleasing web applications.
- You have been given a specific set of files to work with based on the user's request.

STACK-SPECIFIC RULES:
- **vanilla**: Use index.html, style.css, script.js. Use CDNs for libraries.
- **react**: Use JSX/TSX. Assume 'react' and 'react-dom' are available via ESM imports.
- **nextjs**: Use App Router structure (app/page.tsx, app/layout.tsx). Use Tailwind CSS.

PROCESS:
1. **THOUGHT**: Plan your specific code changes.
2. **OPERATIONS**: Return 'CREATE', 'UPDATE', or 'DELETE' operations.
3. **COMMANDS**: If you need to "install" a package or run a command, include it in the 'commands' array.

FORMAT:
Return strictly JSON.
`;

// --- HELPER: ROBUST JSON PARSER ---

const parseJsonLoose = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 1. Try to find markdown JSON block
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try { return JSON.parse(markdownMatch[1]); } catch (e2) {}
    }

    // 2. Try to find raw JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch && objectMatch[0]) {
      try { return JSON.parse(objectMatch[0]); } catch (e3) {}
    }

    // 3. Try to find raw JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch && arrayMatch[0]) {
      try { return JSON.parse(arrayMatch[0]); } catch (e4) {}
    }

    throw new Error("Could not parse JSON from response. Raw response: " + text.substring(0, 50) + "...");
  }
};

// --- CUSTOM API HANDLER ---

const callCustomAi = async (
  modelConfig: CustomModel,
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${modelConfig.apiKey}`
  };

  const body = {
    model: modelConfig.modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    // Removed strict response_format to support all models (StepFun, LocalLLM, etc.)
    // We rely on the system prompt and robust parsing instead.
    temperature: 0.7
  };

  // Adjust URL to ensure it ends with /chat/completions if not provided
  let url = modelConfig.baseUrl;
  if (!url.endsWith('/v1') && !url.endsWith('/chat/completions')) {
     if (url.endsWith('/')) url += 'v1/chat/completions';
     else url += '/v1/chat/completions';
  } else if (url.endsWith('/v1')) {
     url += '/chat/completions';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    // Try to parse error to show a cleaner message if possible
    try {
        const jsonErr = JSON.parse(err);
        const msg = jsonErr.error?.message || jsonErr.message || err;
        throw new Error(`Custom API Error: ${msg}`);
    } catch {
        throw new Error(`Custom API Error: ${err}`);
    }
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

export const testCustomConnection = async (model: CustomModel): Promise<boolean> => {
  try {
    await callCustomAi(model, "You are a ping bot. Reply with 'pong'.", "Ping");
    return true;
  } catch (e) {
    console.error("Connection test failed:", e);
    return false;
  }
};

// --- SERVICES ---

/**
 * Stage 1: The Architect
 */
export const planFileChanges = async (
  prompt: string,
  filePaths: string[],
  modelName: GeminiModel,
  customModel?: CustomModel
): Promise<string[]> => {
  
  const content = `Current File List:\n${filePaths.join('\n')}\nUser Request: ${prompt}`;

  if (customModel) {
    // USE CUSTOM API
    try {
      const result = await callCustomAi(customModel, PLANNING_SYSTEM_PROMPT, content);
      const plannedFiles = parseJsonLoose(result);
      return Array.isArray(plannedFiles) ? plannedFiles : [];
    } catch (e) {
      console.error("Custom planning failed or returned invalid JSON", e);
      // Fallback: If planning fails, assume all files are relevant (safer than none)
      return filePaths;
    }
  } else {
    // USE GOOGLE GENAI
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
    const ai = new GoogleGenAI({ apiKey });
    
    // Always use flash for planning if not custom
    const planningModel = 'gemini-3-flash-preview'; 

    const response = await ai.models.generateContent({
      model: planningModel,
      contents: { parts: [{ text: content }] },
      config: {
        systemInstruction: PLANNING_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    try {
      const plannedFiles = JSON.parse(response.text || "[]");
      return Array.isArray(plannedFiles) ? plannedFiles : [];
    } catch (e) {
      return filePaths;
    }
  }
};

/**
 * Stage 2: The Engineer
 */
export const generateCode = async (
  prompt: string, 
  currentFiles: FileNode[],
  modelName: GeminiModel,
  stack: ProjectStack,
  attachments: Attachment[] = [],
  customModel?: CustomModel
): Promise<AiResponse> => {
  
  const fileContext = currentFiles.map(f => `Path: ${f.path}\nContent:\n${f.content}\n---`).join('\n');
  const fullSystemPrompt = getCodingSystemPrompt(stack);
  
  // Construct user message
  let userMessage = `Current Stack: ${stack}\n\nSelected Context Files:\n${fileContext}\n\nUser Goal: ${prompt}`;
  
  // Handle attachments in text representation for custom models
  attachments.forEach(att => {
    if (att.type === 'text') {
      userMessage += `\n\nAttached File (${att.name}):\n${att.data}`;
    }
  });

  if (customModel) {
    // USE CUSTOM API
    const result = await callCustomAi(customModel, fullSystemPrompt, userMessage);
    try {
      return parseJsonLoose(result) as AiResponse;
    } catch (e) {
       throw new Error(`AI returned invalid format. Please try again. details: ${e}`);
    }
  } else {
    // USE GOOGLE GENAI
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [{ text: userMessage }];

    // Handle Image Attachments for Google
    attachments.forEach(att => {
      if (att.type === 'image') {
        parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
      }
    });

    const response = await ai.models.generateContent({
      model: modelName as string,
      contents: { parts: parts },
      config: {
        systemInstruction: fullSystemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought: { type: Type.STRING },
            commands: { type: Type.ARRAY, items: { type: Type.STRING } },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  operation: { type: Type.STRING, enum: ["CREATE", "UPDATE", "DELETE"] },
                  path: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["operation", "path"]
              }
            }
          },
          required: ["thought", "files"]
        }
      }
    });

    try {
      return JSON.parse(response.text) as AiResponse;
    } catch (e) {
      throw new Error("AI returned invalid JSON structure.");
    }
  }
};

export const generateProjectTitle = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return "New Project";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short 2-3 word title for: "${prompt}"`,
    });
    return response.text?.trim().replace(/"/g, '') || "New Project";
  } catch (e) {
    return "New Project";
  }
};
