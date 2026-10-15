'use client';
import { useEffect,useState,useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, Minimize2, Sparkles, Users, Clock3, ArrowRight, MonitorPlay } from 'lucide-react';
import Brand from '@/components/Brand';
import { Results } from '@/components/Results';
import { state } from '@/lib/client';
import { labelFor } from '@/lib/catalog';

export default function Screen(){
 const {code}=useParams(),roomCode=String(code||'').toUpperCase(),[data,setData]=useState(null),[error,setError]=useState(''),[origin,setOrigin]=useState(''),[full,setFull]=useState(false);
 const load=useCallback(async()=>{try{const d=await state(roomCode);setData(d);setError('')}catch(e){setError(e.message)}},[roomCode]);
 useEffect(()=>{setOrigin(window.location.origin);load();const interval=setInterval(load,4000);return()=>clearInterval(interval)},[load]);
 const toggleFull=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();setFull(!!document.fullscreenElement)}catch{}};
 const q=data?.question,room=data?.room;
 return <main className="screen-page" data-theme={room?.theme||'violet'}><div className="screen-header"><Brand/><div className="screen-pills"><span className="screen-session"><span className="pulse-dot"/> {room?.title||'InsightLive'}</span><button className="fullscreen-btn" title="Fullscreen" onClick={toggleFull}>{full?<Minimize2 size={20}/>:<Maximize2 size={20}/>}</button></div></div>
  <div className="screen-main"><div className="screen-left"><span className="screen-eyebrow">{q?labelFor(q.type):'INTERACTIVE PRESENTATION'}</span><h1>{q?.text||'Menunggu pertanyaan pertama...'}</h1><p className="screen-subtitle">{q?.revealed?'Ini hasil respons audiens':'Scan QR code atau buka link di HP dan bagikan jawaban kamu.'}</p>
    <div className="screen-stats"><div><strong>{data?.count||0}</strong><span>Jawaban masuk</span></div><div><strong>{room?.status==='open'?'LIVE':'PAUSED'}</strong><span>Status sesi</span></div></div>
    <div className="screen-code-bottom"><span>JOIN WITH CODE</span><strong>{roomCode}</strong></div>
  </div><div className="screen-right">{!data?<div className="empty-panel">{error||'Memuat layar presentasi...'}</div>:!q?<div className="waiting-screen"><Clock3 size={70}/><h2>Get ready!</h2><p>Pertanyaan akan segera tampil.</p></div>:q.revealed?<div className="screen-result-card"><span className="eyebrow"><Sparkles size={15}/> LIVE RESULTS</span><Results question={q} result={data.result} large/></div>:<div className="screen-join-card"><span className="eyebrow">JOIN THE CONVERSATION</span><div className="qr-projection">{origin&&<QRCodeSVG value={`${origin}/join/${roomCode}`} size={225}/>}</div><p>Scan untuk menjawab</p><strong className="projection-code">{roomCode}</strong><span className="join-url">{origin?`${origin.replace(/^https?:\/\//,'')}/join/${roomCode}`:`/join/${roomCode}`}</span></div>}</div></div>
  <footer className="screen-footer"><span>INSIGHTLIVE · POWERED BY GEMINI</span><span>{q?.revealed?'Hasil ditampilkan presenter':'Menunggu respons audiens'} <ArrowRight size={17}/></span></footer>
 </main>
}
