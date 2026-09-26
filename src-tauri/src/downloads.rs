use futures_util::StreamExt;
use serde::Serialize;
use sha2::{Digest,Sha256};
use std::{collections::HashMap,path::PathBuf,sync::Arc};
use tauri::{AppHandle,Emitter};
use tokio::{fs::{self,OpenOptions},io::AsyncWriteExt,sync::{Mutex,watch}};

#[derive(Clone,Serialize)] pub struct DownloadProgress{pub id:String,pub downloaded:u64,pub total:Option<u64>,pub percent:f64,pub state:String}
#[derive(Clone)] pub struct DownloadManager{controls:Arc<Mutex<HashMap<String,watch::Sender<String>>>>}
impl DownloadManager{pub fn new()->Self{Self{controls:Arc::new(Mutex::new(HashMap::new()))}}
 pub async fn control(&self,id:&str,action:&str)->Result<(),String>{let map=self.controls.lock().await;let tx=map.get(id).ok_or("Descarga no encontrada")?;tx.send(action.into()).map_err(|e|e.to_string())?;Ok(())}
 pub async fn start(&self,app:AppHandle,id:String,url:String,dest:PathBuf,sha256:Option<String>)->Result<(),String>{
  let part=dest.with_extension(format!("{}part",dest.extension().map(|x|format!("{}.",x.to_string_lossy())).unwrap_or_default()));if let Some(p)=dest.parent(){fs::create_dir_all(p).await.map_err(|e|e.to_string())?}
  let existing=fs::metadata(&part).await.map(|m|m.len()).unwrap_or(0);let client=reqwest::Client::new();let mut req=client.get(&url);if existing>0{req=req.header(reqwest::header::RANGE,format!("bytes={}-",existing))}let resp=req.send().await.map_err(|e|e.to_string())?;if !resp.status().is_success()&&resp.status()!=reqwest::StatusCode::PARTIAL_CONTENT{return Err(format!("HTTP {}",resp.status()))}
  let remaining=resp.content_length();let total=remaining.map(|r|r+existing);let (tx,mut rx)=watch::channel("running".to_string());self.controls.lock().await.insert(id.clone(),tx);let mut file=OpenOptions::new().create(true).append(existing>0).write(true).open(&part).await.map_err(|e|e.to_string())?;let mut stream=resp.bytes_stream();let mut downloaded=existing;
  while let Some(chunk)=stream.next().await{let action=rx.borrow().clone();if action=="cancel"{drop(file);let _=fs::remove_file(&part).await;let _=app.emit("download-progress",DownloadProgress{id:id.clone(),downloaded,total,percent:0.0,state:"cancelled".into()});self.controls.lock().await.remove(&id);return Ok(())}if action=="pause"{let _=app.emit("download-progress",DownloadProgress{id:id.clone(),downloaded,total,percent:total.map(|t|downloaded as f64*100.0/t as f64).unwrap_or(0.0),state:"paused".into()});loop{rx.changed().await.map_err(|e|e.to_string())?;if rx.borrow().as_str()!="pause"{break}}continue}let bytes=chunk.map_err(|e|e.to_string())?;file.write_all(&bytes).await.map_err(|e|e.to_string())?;downloaded+=bytes.len() as u64;let percent=total.map(|t|downloaded as f64*100.0/t as f64).unwrap_or(0.0);let _=app.emit("download-progress",DownloadProgress{id:id.clone(),downloaded,total,percent,state:"running".into()});}
  file.flush().await.map_err(|e|e.to_string())?;drop(file);if let Some(expected)=sha256{let data=fs::read(&part).await.map_err(|e|e.to_string())?;let got=hex::encode(Sha256::digest(&data));if got.to_lowercase()!=expected.to_lowercase(){return Err("SHA-256 incorrecto".into())}}fs::rename(&part,&dest).await.map_err(|e|e.to_string())?;let _=app.emit("download-progress",DownloadProgress{id:id.clone(),downloaded,total,percent:100.0,state:"complete".into()});self.controls.lock().await.remove(&id);Ok(())}}
