import type { GenerationRequest } from './comfyui';
const seed=(r:GenerationRequest)=>r.seed??Math.floor(Math.random()*2_147_483_647);
const common=(r:GenerationRequest)=>({
 '4':{class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:r.model}},
 '6':{class_type:'CLIPTextEncode',inputs:{text:r.prompt,clip:['4',1]}},
 '7':{class_type:'CLIPTextEncode',inputs:{text:r.negativePrompt||'blurry, low quality, distorted, watermark',clip:['4',1]}},
});
export function textToImageWorkflow(r:GenerationRequest){return{...common(r),'3':{class_type:'KSampler',inputs:{seed:seed(r),steps:25,cfg:7,sampler_name:'euler',scheduler:'normal',denoise:1,model:['4',0],positive:['6',0],negative:['7',0],latent_image:['5',0]}},'5':{class_type:'EmptyLatentImage',inputs:{width:r.width,height:r.height,batch_size:1}},'8':{class_type:'VAEDecode',inputs:{samples:['3',0],vae:['4',2]}},'9':{class_type:'SaveImage',inputs:{filename_prefix:'NavagartAI',images:['8',0]}}}}
export function imageToImageWorkflow(r:GenerationRequest){if(!r.inputImage)throw new Error('Selecciona una imagen de referencia');return{...common(r),'3':{class_type:'KSampler',inputs:{seed:seed(r),steps:25,cfg:7,sampler_name:'euler',scheduler:'normal',denoise:r.denoise??0.55,model:['4',0],positive:['6',0],negative:['7',0],latent_image:['11',0]}},'10':{class_type:'LoadImage',inputs:{image:r.inputImage}},'11':{class_type:'VAEEncode',inputs:{pixels:['10',0],vae:['4',2]}},'8':{class_type:'VAEDecode',inputs:{samples:['3',0],vae:['4',2]}},'9':{class_type:'SaveImage',inputs:{filename_prefix:'NavagartAI_img2img',images:['8',0]}}}}
export function buildWorkflow(r:GenerationRequest){if(r.mode==='Text → Image')return textToImageWorkflow(r);if(r.mode==='Image → Image')return imageToImageWorkflow(r);throw new Error(`${r.mode} se añadirá con el workflow de vídeo Wan.`)}
