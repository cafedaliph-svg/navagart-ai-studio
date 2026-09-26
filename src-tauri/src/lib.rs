mod downloads;
use downloads::DownloadManager;
use serde::{Deserialize, Serialize};
use std::{fs, path::{Path, PathBuf}, process::{Command, Stdio}};
use tauri::{AppHandle, State};

#[derive(Serialize)]
struct HardwareInfo { gpu: String, vram_mb: Option<u64>, nvidia: bool, recommended_profile: String }
#[derive(Serialize, Deserialize, Clone)]
struct ModelFile { url: String, filename: String, folder: String, sha256: Option<String> }
#[derive(Serialize, Deserialize, Clone)]
struct ModelSpec { id: String, name: String, kind: String, size_gb: f32, min_vram_gb: u32, license: String, recommended_profiles: Vec<String>, files: Vec<ModelFile> }
#[derive(Serialize)]
struct ModelState { spec: ModelSpec, installed: bool, partial: bool, recommended: bool }

fn root() -> PathBuf { std::env::var("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from(".")).join("NavagartAI").join("engine") }
fn comfy() -> PathBuf { root().join("ComfyUI") }
fn runtime() -> PathBuf { root().join("python") }

fn catalog() -> Vec<ModelSpec> { vec![
    ModelSpec { id:"sdxl-base".into(), name:"SDXL Base 1.0".into(), kind:"image".into(), size_gb:6.9, min_vram_gb:8, license:"Stability AI model license / OpenRAIL. Review before use.".into(), recommended_profiles:vec!["image-only".into(),"wan-low-vram".into()], files:vec![ModelFile { url:"https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors".into(), filename:"sd_xl_base_1.0.safetensors".into(), folder:"checkpoints".into(), sha256:None }] },
    ModelSpec { id:"flux1-schnell".into(), name:"FLUX.1 Schnell".into(), kind:"image".into(), size_gb:23.8, min_vram_gb:16, license:"Apache-2.0 for FLUX.1-schnell weights; review model card.".into(), recommended_profiles:vec!["wan-balanced".into(),"wan-quality".into()], files:vec![ModelFile { url:"https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors".into(), filename:"flux1-schnell.safetensors".into(), folder:"unet".into(), sha256:None }] },
    ModelSpec { id:"wan22-ti2v-5b".into(), name:"Wan 2.2 TI2V 5B".into(), kind:"video".into(), size_gb:18.0, min_vram_gb:8, license:"Wan model license and component licenses apply. Review model cards before use.".into(), recommended_profiles:vec!["wan-low-vram".into(),"wan-balanced".into(),"wan-quality".into()], files:vec![
        ModelFile { url:"https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors".into(), filename:"wan2.2_ti2v_5B_fp16.safetensors".into(), folder:"diffusion_models".into(), sha256:None },
        ModelFile { url:"https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors".into(), filename:"umt5_xxl_fp8_e4m3fn_scaled.safetensors".into(), folder:"text_encoders".into(), sha256:None },
        ModelFile { url:"https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors".into(), filename:"wan_2.1_vae.safetensors".into(), folder:"vae".into(), sha256:None }
    ] }
] }

fn hardware() -> HardwareInfo {
    if let Ok(o) = Command::new("nvidia-smi").args(["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]).output() {
        if o.status.success() {
            let t = String::from_utf8_lossy(&o.stdout); let l = t.lines().next().unwrap_or(""); let mut p = l.rsplitn(2, ',');
            let v = p.next().and_then(|x| x.trim().parse::<u64>().ok()); let g = p.next().unwrap_or("NVIDIA GPU").trim().to_string();
            let profile = match v.unwrap_or(0) { 0..=8191=>"image-only", 8192..=15999=>"wan-low-vram", 16000..=23999=>"wan-balanced", _=>"wan-quality" }.into();
            return HardwareInfo { gpu:g, vram_mb:v, nvidia:true, recommended_profile:profile };
        }
    }
    HardwareInfo { gpu:"No NVIDIA GPU detected".into(), vram_mb:None, nvidia:false, recommended_profile:"image-only".into() }
}

#[tauri::command] fn detect_hardware() -> HardwareInfo { hardware() }
#[tauri::command] fn engine_status() -> String { if comfy().exists() { "installed".into() } else { "not-installed".into() } }

fn download_sync(url: &str, dest: &Path) -> Result<(), String> {
    if let Some(p) = dest.parent() { fs::create_dir_all(p).map_err(|e| e.to_string())?; }
    let ps = format!("$ProgressPreference='SilentlyContinue';Invoke-WebRequest -UseBasicParsing -Uri '{}' -OutFile '{}'", url.replace("'","''"), dest.to_string_lossy().replace("'","''"));
    if Command::new("powershell").args(["-NoProfile","-Command",&ps]).status().map_err(|e| e.to_string())?.success() { Ok(()) } else { Err("Falló la descarga".into()) }
}

fn bootstrap_python() -> Result<PathBuf, String> {
    let r=runtime(); let py=r.join("python.exe"); if py.exists() { return Ok(py); }
    fs::create_dir_all(&r).map_err(|e| e.to_string())?;
    let zip=root().join("python.zip"); download_sync("https://www.python.org/ftp/python/3.13.15/python-3.13.15-embed-amd64.zip", &zip)?;
    let ps=format!("Expand-Archive -Force '{}' '{}'", zip.to_string_lossy(), r.to_string_lossy());
    if !Command::new("powershell").args(["-NoProfile","-Command",&ps]).status().map_err(|e| e.to_string())?.success() { return Err("No se pudo extraer Python".into()); }
    let pth=r.join("python313._pth"); if pth.exists() { fs::write(&pth, fs::read_to_string(&pth).map_err(|e|e.to_string())?.replace("#import site","import site")).map_err(|e|e.to_string())?; }
    let gp=root().join("get-pip.py"); download_sync("https://bootstrap.pypa.io/get-pip.py", &gp)?;
    if !Command::new(&py).arg(&gp).status().map_err(|e|e.to_string())?.success() { return Err("No se pudo instalar pip".into()); }
    Ok(py)
}

#[tauri::command]
fn install_ai_engine() -> Result<String, String> {
    fs::create_dir_all(root()).map_err(|e| e.to_string())?;
    let py = bootstrap_python()?;
    if !comfy().exists() {
        let zip=root().join("comfyui.zip"); download_sync("https://github.com/Comfy-Org/ComfyUI/archive/refs/heads/master.zip", &zip)?;
        let tmp=root().join("comfy-tmp"); let ps=format!("Expand-Archive -Force '{}' '{}'", zip.to_string_lossy(), tmp.to_string_lossy());
        if !Command::new("powershell").args(["-NoProfile","-Command",&ps]).status().map_err(|e|e.to_string())?.success() { return Err("No se pudo extraer ComfyUI".into()); }
        fs::rename(tmp.join("ComfyUI-master"), comfy()).map_err(|e|e.to_string())?;
        let _ = fs::remove_dir_all(tmp);
    }
    let req = comfy().join("requirements.txt");
    if !Command::new(&py).args(["-m","pip","install","-r",req.to_string_lossy().as_ref()]).status().map_err(|e|e.to_string())?.success() { return Err("Falló la instalación de dependencias".into()); }
    Ok(root().to_string_lossy().to_string())
}

#[tauri::command]
fn start_ai_engine() -> Result<String,String> {
    let py=runtime().join("python.exe"); if !py.exists() { return Err("Instala primero el motor IA".into()); }
    Command::new(py).current_dir(comfy()).args(["main.py","--listen","127.0.0.1","--port","8188"]).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e|e.to_string())?;
    Ok("started".into())
}

#[tauri::command]
fn list_models() -> Vec<ModelState> {
    let profile=hardware().recommended_profile;
    catalog().into_iter().map(|s| {
        let installed=s.files.iter().all(|f| comfy().join("models").join(&f.folder).join(&f.filename).exists());
        let partial=s.files.iter().any(|f| { let d=comfy().join("models").join(&f.folder).join(&f.filename); d.with_extension(format!("{}part",d.extension().map(|x|format!("{}.",x.to_string_lossy())).unwrap_or_default())).exists() });
        let recommended=s.recommended_profiles.contains(&profile); ModelState { spec:s, installed, partial, recommended }
    }).collect()
}

#[tauri::command]
async fn install_model(app:AppHandle, state:State<'_,DownloadManager>, id:String, accepted_license:bool) -> Result<String,String> {
    if !accepted_license { return Err("Debes aceptar la licencia".into()); }
    let spec=catalog().into_iter().find(|m|m.id==id).ok_or("Modelo desconocido")?;
    for (i,f) in spec.files.iter().enumerate() {
        let dest=comfy().join("models").join(&f.folder).join(&f.filename); if dest.exists() { continue; }
        let job=format!("{}:{}",spec.id,i); state.start(app.clone(),job,f.url.clone(),dest,f.sha256.clone()).await?;
    }
    Ok("installed".into())
}

#[tauri::command]
async fn control_download(state:State<'_,DownloadManager>, id:String, action:String) -> Result<(),String> { state.control(&id,&action).await }

#[tauri::command]
fn remove_model(id:String) -> Result<String,String> {
    let s=catalog().into_iter().find(|m|m.id==id).ok_or("Modelo desconocido")?;
    for f in s.files { let d=comfy().join("models").join(f.folder).join(f.filename); let _=fs::remove_file(d); }
    Ok("removed".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default().manage(DownloadManager::new()).invoke_handler(tauri::generate_handler![engine_status,detect_hardware,install_ai_engine,start_ai_engine,list_models,install_model,control_download,remove_model]).run(tauri::generate_context!()).expect("error while running Navagart AI Studio");
}
