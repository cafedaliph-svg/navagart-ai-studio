# Wan 2.2 — vídeo local

Navagart AI Studio V0.4 incorpora adaptadores para Text → Video e Image → Video mediante ComfyUI + Wan 2.2.

## Modelo recomendado inicialmente

Para simplificar la instalación se configura Wan 2.2 TI2V 5B, capaz de trabajar con texto e imagen.

Archivos esperados por defecto:

- `models/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors`
- `models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors`
- `models/vae/wan2.2_vae.safetensors`

Los nombres están centralizados en `src/lib/wan.ts` para poder cambiarlos por variantes FP8 u otros modelos.

## Funciones V0.4

- Text → Video
- Image → Video
- Imagen inicial subida desde Navagart
- 3 / 5 / 8 segundos
- 16 / 24 FPS
- 16:9 / 9:16 / 1:1
- Seed
- Negative prompt
- Presets de movimiento de cámara incorporados al prompt
- Seguimiento del job de ComfyUI
- Reproductor de vídeo integrado

## Nota de compatibilidad

Wan evoluciona junto con los nodos nativos de ComfyUI. Navagart mantiene el adaptador de vídeo separado (`src/lib/wan.ts`) para que los nombres/modelos/nodos puedan actualizarse sin tocar la interfaz principal.
