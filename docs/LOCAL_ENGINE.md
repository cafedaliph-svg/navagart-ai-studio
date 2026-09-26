# Motor local — ComfyUI

Navagart AI Studio V0.2 se conecta a ComfyUI en `127.0.0.1:8188`.

## Primera generación real

1. Instala/abre ComfyUI en Windows.
2. Coloca un checkpoint compatible (por ejemplo SDXL) en `ComfyUI/models/checkpoints/`.
3. Inicia ComfyUI en el puerto 8188.
4. Abre Navagart AI Studio.
5. Selecciona **Text → Image**.
6. Escribe exactamente el nombre del checkpoint en **Checkpoint**.
7. Introduce el prompt y pulsa **Generate imagen**.

El trabajo se envía mediante la API `/prompt` de ComfyUI y la imagen se guarda en la carpeta `ComfyUI/output` con prefijo `NavagartAI`.

## Estado actual

- Text → Image: conectado a ComfyUI.
- Image → Image: siguiente workflow.
- Text → Video: pendiente de workflow/modelos de vídeo.
- Image → Video: pendiente de workflow/modelos de vídeo.

## Arquitectura

La interfaz no contiene lógica específica de un único modelo. `src/lib/comfyui.ts` actúa como cliente del motor y `src/lib/workflows.ts` construye workflows. Esto permitirá añadir SDXL, FLUX, Wan y otros motores sin rehacer la interfaz.
