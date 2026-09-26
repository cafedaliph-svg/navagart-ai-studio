import { invoke } from '@tauri-apps/api/core';
export type HardwareInfo={gpu:string;vram_mb:number|null;nvidia:boolean;recommended_profile:string};
export type ModelFile={url:string;filename:string;folder:string;sha256:string|null};
export type ModelSpec={id:string;name:string;kind:string;size_gb:number;min_vram_gb:number;license:string;recommended_profiles:string[];files:ModelFile[]};
export type ModelState={spec:ModelSpec;installed:boolean;partial:boolean;recommended:boolean};
export type DownloadProgress={id:string;downloaded:number;total:number|null;percent:number;state:'running'|'paused'|'cancelled'|'complete'};
export const detectHardware=()=>invoke<HardwareInfo>('detect_hardware');
export const localEngineStatus=()=>invoke<string>('engine_status');
export const installAIEngine=()=>invoke<string>('install_ai_engine');
export const startAIEngine=()=>invoke<string>('start_ai_engine');
export const listModels=()=>invoke<ModelState[]>('list_models');
export const installModel=(id:string,accepted_license:boolean)=>invoke<string>('install_model',{id,acceptedLicense:accepted_license});
export const controlDownload=(id:string,action:'pause'|'running'|'cancel')=>invoke<void>('control_download',{id,action});
export const removeModel=(id:string)=>invoke<string>('remove_model',{id});
export function profileLabel(profile:string){return ({'image-only':'Imagen local','wan-low-vram':'Wan Low VRAM','wan-balanced':'Wan Balanced','wan-quality':'Wan Quality'} as Record<string,string>)[profile]||profile}
