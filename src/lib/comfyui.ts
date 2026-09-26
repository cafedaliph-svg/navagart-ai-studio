export type GenerationMode = 'Text → Image' | 'Image → Image' | 'Text → Video' | 'Image → Video';

export type GenerationRequest = {
  mode: GenerationMode;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  seed?: number;
  camera?: string;
  duration?: number;
  fps?: number;
};

export type QueueResult = { prompt_id: string; number?: number };

const endpoint = (path: string) => `http://127.0.0.1:8188${path}`;

export async function getComfyStatus() {
  const response = await fetch(endpoint('/system_stats'));
  if (!response.ok) throw new Error('ComfyUI no responde');
  return response.json();
}

export async function queueWorkflow(workflow: Record<string, unknown>): Promise<QueueResult> {
  const response = await fetch(endpoint('/prompt'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!response.ok) throw new Error(`ComfyUI rechazó el workflow (${response.status})`);
  return response.json();
}

export async function getHistory(promptId: string) {
  const response = await fetch(endpoint(`/history/${promptId}`));
  if (!response.ok) throw new Error('No se pudo consultar el trabajo');
  return response.json();
}

export function outputUrl(filename: string, subfolder = '', type = 'output') {
  const params = new URLSearchParams({ filename, subfolder, type });
  return endpoint(`/view?${params.toString()}`);
}

export function dimensionsForRatio(ratio: string) {
  if (ratio === '9:16') return { width: 768, height: 1360 };
  if (ratio === '1:1') return { width: 1024, height: 1024 };
  return { width: 1360, height: 768 };
}
