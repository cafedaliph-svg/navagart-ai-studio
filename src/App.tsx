import { useMemo, useState } from 'react';
import { Aperture, Clapperboard, FolderOpen, GalleryVerticalEnd, Image, Layers3, Play, Settings, Sparkles, Video } from 'lucide-react';

type Mode = 'Text → Image' | 'Image → Image' | 'Text → Video' | 'Image → Video';

const modes: { label: Mode; icon: typeof Image }[] = [
  { label: 'Text → Image', icon: Image },
  { label: 'Image → Image', icon: Layers3 },
  { label: 'Text → Video', icon: Video },
  { label: 'Image → Video', icon: Clapperboard },
];

const cameras = ['Static', 'Dolly In', 'Dolly Out', 'Orbit Left', 'Orbit Right', 'Crane Up', 'Handheld', 'FPV'];

export default function App() {
  const [mode, setMode] = useState<Mode>('Image → Video');
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [camera, setCamera] = useState('Dolly In');
  const [queued, setQueued] = useState(0);

  const mediaKind = useMemo(() => mode.includes('Video') ? 'vídeo' : 'imagen', [mode]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark"><Aperture size={22}/></div><div><strong>NAVAGART</strong><span>AI STUDIO</span></div></div>
        <nav>
          <button className="nav active"><Sparkles size={18}/> Create</button>
          <button className="nav"><GalleryVerticalEnd size={18}/> Generations</button>
          <button className="nav"><FolderOpen size={18}/> Projects</button>
          <button className="nav"><Layers3 size={18}/> Assets</button>
        </nav>
        <div className="sidebarBottom"><button className="nav"><Settings size={18}/> Settings</button><div className="local"><span className="dot"/> Local engine ready</div></div>
      </aside>

      <main>
        <header><div><span className="eyebrow">CREATE</span><h1>Turn ideas into motion.</h1><p>Genera imágenes y vídeo desde una sola estación de trabajo.</p></div><button className="queue">Queue <b>{queued}</b></button></header>

        <section className="modebar">{modes.map(({label, icon: Icon}) => <button key={label} onClick={() => setMode(label)} className={mode === label ? 'selected' : ''}><Icon size={17}/>{label}</button>)}</section>

        <div className="workspace">
          <section className="composer card">
            <div className="cardTitle"><span>Generation</span><span className="badge">V0.1</span></div>
            <label>Prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={`Describe el ${mediaKind} que quieres crear...`} />
            <div className="fieldGrid">
              <div><label>Provider</label><select><option>Local / ComfyUI</option><option>API Provider</option></select></div>
              <div><label>Model</label><select><option>Auto</option><option>Wan 2.2</option><option>SDXL</option></select></div>
              <div><label>Aspect ratio</label><select value={ratio} onChange={e => setRatio(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select></div>
              <div><label>Seed</label><input placeholder="Random" /></div>
            </div>
            {mode.includes('Video') && <><label>Camera motion</label><div className="chips">{cameras.map(c => <button key={c} onClick={() => setCamera(c)} className={camera === c ? 'activeChip' : ''}>{c}</button>)}</div><div className="fieldGrid"><div><label>Duration</label><select><option>5 seconds</option><option>8 seconds</option><option>10 seconds</option></select></div><div><label>FPS</label><select><option>24</option><option>30</option></select></div></div></>}
            <button className="generate" onClick={() => setQueued(q => q + 1)} disabled={!prompt.trim()}><Sparkles size={18}/> Generate {mediaKind}</button>
          </section>

          <section className="preview card"><div className="previewTop"><span>Preview</span><span>{ratio}</span></div><div className={`canvas ratio-${ratio.replace(':','')}`}><div className="empty"><Play size={30}/><strong>Your creation appears here</strong><span>Configura el prompt y pulsa Generate.</span></div></div><div className="status"><span><span className="dot"/> Engine</span><b>Waiting</b></div></section>
        </div>
      </main>
    </div>
  );
}
