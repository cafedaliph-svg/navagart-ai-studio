#[tauri::command]
fn engine_status() -> String {
    "ready".into()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![engine_status])
        .run(tauri::generate_context!())
        .expect("error while running Navagart AI Studio");
}
