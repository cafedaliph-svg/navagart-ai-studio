# Instalador del motor local

La V0.5 introduce gestión del motor desde Tauri/Rust.

## Qué hace
- Detecta NVIDIA mediante `nvidia-smi` y lee VRAM.
- Recomienda un perfil: image-only, wan-low-vram, wan-balanced o wan-quality.
- Instala ComfyUI en `%LOCALAPPDATA%\NavagartAI\engine`.
- Crea un entorno virtual Python aislado e instala requirements.
- Puede iniciar ComfyUI automáticamente en `127.0.0.1:8188`.
- GitHub Actions construye MSI y NSIS/EXE para Windows al lanzar un tag `v*` o manualmente.

## Requisitos temporales
Esta primera versión del bootstrapper requiere Git y Python 3 instalados en Windows. Una versión posterior podrá empaquetar/descargar un runtime Python y eliminar estos requisitos.

## Modelos
No se descargan pesos automáticamente todavía. Es deliberado: antes de descargar decenas de GB, la aplicación debe mostrar tamaño, licencia, requisitos de VRAM y pedir al usuario que seleccione el perfil/modelo.

## Instalación manual de desarrollo
También existe `scripts/install-windows.ps1` para probar el bootstrapper sin abrir la interfaz.
