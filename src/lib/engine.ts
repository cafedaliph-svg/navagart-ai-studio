import { invoke } from '@tauri-apps/api/core';
export type HardwareInfo={gpu:string;vram_mb:number|null;nvidia:boolean;recommended_profile:string};
export const detectHardware=()=>invoke<HardwareInfo>('detect_hardware');
export const localEngineStatus=()=>invoke<string>('engine_status');
export const installAIEngine=()=>invoke<string>('install_ai_engine');
export const startAIEngine=()=>invoke<string>('start_ai_engine');
export function profileLabel(profile:string){return ({'image-only':'Imagen local','wan-low-vram':'Wan Low VRAM','wan-balanced':'Wan Balanced','wan-quality':'Wan Quality'} as Record<string,string>)[profile]||profile}
