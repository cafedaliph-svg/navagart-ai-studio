$ErrorActionPreference = 'Stop'
$Root = Join-Path $env:LOCALAPPDATA 'NavagartAI\engine'
$Comfy = Join-Path $Root 'ComfyUI'
$Venv = Join-Path $Root 'venv'
Write-Host 'Navagart AI Studio - Local Engine Installer'
New-Item -ItemType Directory -Force -Path $Root | Out-Null
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required. Install Git for Windows first.' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python 3 is required. Install Python first.' }
if (-not (Test-Path $Comfy)) { git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git $Comfy }
if (-not (Test-Path $Venv)) { python -m venv $Venv }
& "$Venv\Scripts\python.exe" -m pip install --upgrade pip
& "$Venv\Scripts\pip.exe" install -r "$Comfy\requirements.txt"
Write-Host "Engine installed at $Root"
Write-Host 'Models are intentionally not downloaded automatically yet: model licenses and hardware profiles must be selected explicitly.'
