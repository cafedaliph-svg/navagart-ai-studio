use serde::Serialize;
use std::{fs, path::PathBuf, process::{Command, Stdio}};

#[derive(Serialize)]
struct HardwareInfo { gpu: String, vram_mb: Option<u64>, nvidia: bool, recommended_profile: String }

fn engine_dir() -> PathBuf {
    std::env::var("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from(".")).join("NavagartAI").join("engine")
}

#[tauri::command]
fn detect_hardware() -> HardwareInfo {
    let output = Command::new("nvidia-smi").args(["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]).output();
    if let Ok(out) = output {
        if out.status.success() {
            let text=String::from_utf8_lossy(&out.stdout); let line=text.lines().next().unwrap_or(""); let mut p=line.rsplitn(2, ',');
            let vram=p.next().and_then(|x|x.trim().parse::<u64>().ok()); let gpu=p.next().unwrap_or("NVIDIA GPU").trim().to_string();
            let profile=match vram.unwrap_or(0){0..=8191=>"image-only",8192..=15999=>"wan-low-vram",16000..=23999=>"wan-balanced",_=>"wan-quality"}.to_string();
            return HardwareInfo{gpu,vram_mb:vram,nvidia:true,recommended_profile:profile};
        }
    }
    HardwareInfo{gpu:"No NVIDIA GPU detected".into(),vram_mb:None,nvidia:false,recommended_profile:"image-only".into()}
}

#[tauri::command]
fn engine_status() -> String {
    if engine_dir().join("ComfyUI").exists() { "installed".into() } else { "not-installed".into() }
}

#[tauri::command]
fn install_ai_engine() -> Result<String,String> {
    let root=engine_dir(); fs::create_dir_all(&root).map_err(|e|e.to_string())?;
    let comfy=root.join("ComfyUI");
    if !comfy.exists() {
        let status=Command::new("git").args(["clone","--depth","1","https://github.com/comfyanonymous/ComfyUI.git",comfy.to_string_lossy().as_ref()]).status().map_err(|_|"Git no está instalado o no se pudo ejecutar".to_string())?;
        if !status.success(){return Err("No se pudo descargar ComfyUI".into())}
    }
    let venv=root.join("venv");
    if !venv.exists(){let s=Command::new("python").args(["-m","venv",venv.to_string_lossy().as_ref()]).status().map_err(|_|"Python 3 no está instalado".to_string())?;if !s.success(){return Err("No se pudo crear el entorno Python".into())}}
    let pip=venv.join("Scripts").join("pip.exe");
    let req=comfy.join("requirements.txt");
    let s=Command::new(pip).args(["install","-r",req.to_string_lossy().as_ref()]).status().map_err(|e|e.to_string())?;
    if !s.success(){return Err("Falló la instalación de dependencias de ComfyUI".into())}
    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
fn start_ai_engine() -> Result<String,String> {
    let root=engine_dir(); let comfy=root.join("ComfyUI"); let python=root.join("venv").join("Scripts").join("python.exe");
    if !python.exists(){return Err("Instala primero el motor IA".into())}
    Command::new(python).current_dir(&comfy).args(["main.py","--listen","127.0.0.1","--port","8188"]).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e|e.to_string())?;
    Ok("started".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(){tauri::Builder::default().invoke_handler(tauri::generate_handler![engine_status,detect_hardware,install_ai_engine,start_ai_engine]).run(tauri::generate_context!()).expect("error while running Navagart AI Studio");}
