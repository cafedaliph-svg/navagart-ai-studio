import type { GenerationRequest } from './comfyui';

export type WanConfig={textEncoder:string;vae:string;t2vModel:string;ti2vModel:string};
export const defaultWanConfig:WanConfig={textEncoder:'umt5_xxl_fp8_e4m3fn_scaled.safetensors',vae:'wan2.2_vae.safetensors',t2vModel:'wan2.2_ti2v_5B_fp16.safetensors',ti2vModel:'wan2.2_ti2v_5B_fp16.safetensors'};
const seed=(r:GenerationRequest)=>r.seed??Math.floor(Math.random()*2_147_483_647);
const frames=(r:GenerationRequest)=>Math.max(17,Math.round((r.duration||5)*(r.fps||16))+1);
const prompt=(r:GenerationRequest)=>r.camera&&r.camera!=='Static'?`${r.prompt}. Cinematic camera movement: ${r.camera}.`:r.prompt;

/** Wan 2.2 5B native ComfyUI API workflow. Model filenames can be overridden in Settings later. */
export function wanTextToVideo(r:GenerationRequest,c:WanConfig=defaultWanConfig){return{
 '1':{class_type:'UNETLoader',inputs:{unet_name:c.t2vModel,weight_dtype:'default'}},
 '2':{class_type:'CLIPLoader',inputs:{clip_name:c.textEncoder,type:'wan',device:'default'}},
 '3':{class_type:'VAELoader',inputs:{vae_name:c.vae}},
 '4':{class_type:'CLIPTextEncode',inputs:{text:prompt(r),clip:['2',0]}},
 '5':{class_type:'CLIPTextEncode',inputs:{text:r.negativePrompt||'blurry, distorted, low quality, watermark, subtitles',clip:['2',0]}},
 '6':{class_type:'EmptyHunyuanLatentVideo',inputs:{width:r.width,height:r.height,length:frames(r),batch_size:1}},
 '7':{class_type:'ModelSamplingSD3',inputs:{model:['1',0],shift:5}},
 '8':{class_type:'KSampler',inputs:{seed:seed(r),steps:20,cfg:5,sampler_name:'euler',scheduler:'simple',denoise:1,model:['7',0],positive:['4',0],negative:['5',0],latent_image:['6',0]}},
 '9':{class_type:'VAEDecode',inputs:{samples:['8',0],vae:['3',0]}},
 '10':{class_type:'CreateVideo',inputs:{images:['9',0],fps:r.fps||16}},
 '11':{class_type:'SaveVideo',inputs:{video:['10',0],filename_prefix:'NavagartAI_Wan'}}
}}

export function wanImageToVideo(r:GenerationRequest,c:WanConfig=defaultWanConfig){if(!r.inputImage)throw new Error('Selecciona una imagen de referencia');return{
 '1':{class_type:'UNETLoader',inputs:{unet_name:c.ti2vModel,weight_dtype:'default'}},
 '2':{class_type:'CLIPLoader',inputs:{clip_name:c.textEncoder,type:'wan',device:'default'}},
 '3':{class_type:'VAELoader',inputs:{vae_name:c.vae}},
 '4':{class_type:'CLIPTextEncode',inputs:{text:prompt(r),clip:['2',0]}},
 '5':{class_type:'CLIPTextEncode',inputs:{text:r.negativePrompt||'blurry, distorted, low quality, watermark, subtitles',clip:['2',0]}},
 '6':{class_type:'LoadImage',inputs:{image:r.inputImage}},
 '7':{class_type:'WanImageToVideo',inputs:{positive:['4',0],negative:['5',0],vae:['3',0],width:r.width,height:r.height,length:frames(r),batch_size:1,start_image:['6',0]}},
 '8':{class_type:'ModelSamplingSD3',inputs:{model:['1',0],shift:5}},
 '9':{class_type:'KSampler',inputs:{seed:seed(r),steps:20,cfg:5,sampler_name:'euler',scheduler:'simple',denoise:1,model:['8',0],positive:['7',0],negative:['7',1],latent_image:['7',2]}},
 '10':{class_type:'VAEDecode',inputs:{samples:['9',0],vae:['3',0]}},
 '11':{class_type:'CreateVideo',inputs:{images:['10',0],fps:r.fps||16}},
 '12':{class_type:'SaveVideo',inputs:{video:['11',0],filename_prefix:'NavagartAI_Wan_I2V'}}
}}
