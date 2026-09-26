import { invoke } from '@tauri-apps/api/core';
export type HardwareInfo={gpu:string;vram_mb:number|null;nvidia:boolean;recommended_profile:string};
export type ModelSpec={id:string;name:string;kind:string;size_gb:number;min_vram_gb:number;url:string;filename:string;folder:string;license:string;sha256:string|null;recommended_profiles:string[]};
export type ModelState={spec:ModelSpec;installed:boolean;partial:boolean;recommended:boolean};
export type DiskInfo={free_gb:number;engine_path:string};
export const detectHardware=()=>invoke<HardwareInfo>('detect_hardware');
export const localEngineStatus=()=>invoke<string>('engine_status');
export const diskInfo=()=>invoke<DiskInfo>('disk_info');
export const installAIEngine=()=>invoke<string>('install_ai_engine');
export const startAIEngine=()=>invoke<string>('start_ai_engine');
export const listModels=()=>invoke<ModelState[]>('list_models');
export const installModel=(id:string,accepted_license:boolean)=>invoke<string>('install_model',{id,acceptedLicense:accepted_license});
export const verifyModel=(id:string)=>invoke<string>('verify_model',{id});
export const removeModel=(id:string)=>invoke<string>('remove_model',{id});
export function profileLabel(profile:string){return ({'image-only':'Imagen local','wan-low-vram':'Wan Low VRAM','wan-balanced':'Wan Balanced','wan-quality':'Wan Quality'} as Record<string,string>)[profile]||profile}
