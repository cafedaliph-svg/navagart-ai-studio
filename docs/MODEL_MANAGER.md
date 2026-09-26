# Model Manager V0.7

## Incluido
- Catálogo extensible de modelos.
- Recomendación automática según VRAM/perfil de hardware.
- Comprobación de espacio libre antes de iniciar una descarga grande.
- Descarga reanudable: si falla, el archivo `.part` se conserva y el siguiente intento continúa desde el byte descargado cuando el servidor admite Range.
- Verificación SHA-256 preparada por modelo.
- Acción para verificar manualmente un modelo instalado.
- Acción para eliminar modelos.
- Estado `partial` para descargas incompletas.

## Modelos iniciales
- SDXL Base 1.0.
- FLUX.1 Schnell.

## Wan 2.2
Wan 2.2 necesita varios componentes (diffusion model, text encoder y VAE) y workflows concretos. No debe representarse como si fuera un único checkpoint. Se añadirá como un paquete compuesto en el catálogo para que Navagart instale y valide todos sus archivos conjuntamente.

## Seguridad de descargas
El campo `sha256` forma parte del catálogo. Cuando se rellena con un hash oficial/confiable, Navagart calcula SHA-256 tras descargar y elimina el archivo si no coincide. No se deben inventar hashes: los valores deben provenir de la publicación oficial del modelo.

## Cancelación
La descarga actual es reanudable y tolera cierres/fallos, pero la cancelación interactiva desde UI requiere mover las descargas a tareas asíncronas administradas por Tauri. Es el siguiente paso del downloader.
