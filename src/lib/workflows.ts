import type { GenerationRequest } from './comfyui';

/**
 * Workflow mínimo compatible con checkpoints SD/SDXL de ComfyUI.
 * El nombre del checkpoint se obtiene de la selección del usuario.
 */
export function textToImageWorkflow(request: GenerationRequest) {
  const seed = request.seed ?? Math.floor(Math.random() * 2_147_483_647);
  return {
    '3': { class_type: 'KSampler', inputs: { seed, steps: 25, cfg: 7, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] } },
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: request.model } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width: request.width, height: request.height, batch_size: 1 } },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: request.prompt, clip: ['4', 1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: request.negativePrompt || 'blurry, low quality, distorted, watermark', clip: ['4', 1] } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'NavagartAI', images: ['8', 0] } },
  };
}

export function buildWorkflow(request: GenerationRequest) {
  if (request.mode === 'Text → Image') return textToImageWorkflow(request);
  throw new Error(`${request.mode} todavía requiere instalar su workflow/modelo local.`);
}
