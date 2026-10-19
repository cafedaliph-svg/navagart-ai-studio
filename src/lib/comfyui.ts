import { invoke } from '@tauri-apps/api/core';
export type GenerationMode = 'Text → Image' | 'Image → Image' | 'Text → Video' | 'Image → Video';
export type GenerationRequest = { mode: GenerationMode; prompt: string; negativePrompt?: string; model: string; width: number; height: number; seed?: number; camera?: string; duration?: number; fps?: number; inputImage?: string; denoise?: number; };
export type QueueResult = { prompt_id: string; number?: number };
export type OutputAsset = { filename: string; subfolder?: string; type?: string; url: string };
const endpoint=(path:string)=>`http://127.0.0.1:8188${path}`;
export async function getComfyStatus(){return invoke('comfy_request',{path:'/system_stats',method:'GET',body:null})}
export async function getCheckpoints():Promise<string[]>{const d:any=await invoke('comfy_request',{path:'/object_info/CheckpointLoaderSimple',method:'GET',body:null});return d?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]||[]}
export async function uploadImage(file:File){const body=new FormData();body.append('image',file,file.name);body.append('overwrite','true');const r=await fetch(endpoint('/upload/image'),{method:'POST',body});if(!r.ok)throw new Error('No se pudo subir la imagen a ComfyUI');const d=await r.json();return d.name as string}
export async function queueWorkflow(workflow:Record<string,unknown>):Promise<QueueResult>{return invoke<QueueResult>('comfy_request',{path:'/prompt',method:'POST',body:{prompt:workflow}})}
export async function getHistory(promptId:string){return invoke('comfy_request',{path:`/history/${promptId}`,method:'GET',body:null})}
export function outputUrl(filename:string,subfolder='',type='output'){const p=new URLSearchParams({filename,subfolder,type});return endpoint(`/view?${p.toString()}`)}
export async function waitForOutputs(promptId:string,timeoutMs=300000):Promise<OutputAsset[]>{const started=Date.now();while(Date.now()-started<timeoutMs){const history=await getHistory(promptId);const job=history?.[promptId];if(job?.outputs){const assets:OutputAsset[]=[];Object.values(job.outputs).forEach((node:any)=>{[...(node.images||[]),...(node.gifs||[]),...(node.videos||[])].forEach((item:any)=>assets.push({...item,url:outputUrl(item.filename,item.subfolder||'',item.type||'output')}))});if(assets.length)return assets}await new Promise(r=>setTimeout(r,1200))}throw new Error('La generación superó el tiempo de espera')}
export function dimensionsForRatio(ratio:string){if(ratio==='9:16')return{width:768,height:1360};if(ratio==='1:1')return{width:1024,height:1024};return{width:1360,height:768}}
