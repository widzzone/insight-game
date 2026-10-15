'use client';
import { useCallback,useEffect,useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2,ChevronUp,ChevronDown,ArrowRight,Loader2,Users,Lock,Clock3,RefreshCw,Sparkles,Send } from 'lucide-react';
import Brand from '@/components/Brand';
import Countdown from '@/components/Countdown';
import { clientTimer, acceptsTimedAnswer } from '@/lib/timer';
import { Results,ResultCount } from '@/components/Results';
import { api,state,getVisitorId } from '@/lib/client';
import { labelFor } from '@/lib/catalog';

export default function Join(){
 const {code}=useParams(),roomCode=String(code||'').toUpperCase();
 const [clockNow,setClockNow]=useState(Date.now());
 useEffect(()=>{const i=setInterval(()=>setClockNow(Date.now()),500);return()=>clearInterval(i)},[]);
 const [data,setData]=useState(null),[visitor,setVisitor]=useState(''),[name,setName]=useState(''),[value,setValue]=useState(null),[currentQ,setCurrentQ]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
 const load=useCallback(async(id)=>{try{const d=await state(roomCode,{visitorId:id||visitor});setData({...d,server_offset_ms:Date.parse(d.server_now)-Date.now()});setError('')}catch(e){setError(e.message)}},[roomCode,visitor]);
 useEffect(()=>{const id=getVisitorId();setVisitor(id);setName(localStorage.getItem('insightlive_name')||'');load(id)},[roomCode]);
 useEffect(()=>{if(!visitor)return;const interval=setInterval(()=>load(visitor),4000);return()=>clearInterval(interval)},[visitor,load]);
 useEffect(()=>{if(!data?.question?.id||data.question.id===currentQ)return;setCurrentQ(data.question.id);setSent(false);setValue(data.question.type==='ranking'?{ranking:data.question.options.map((_,i)=>i)}:null)},[data?.question?.id,currentQ]);
 async function submit(e){e.preventDefault();if(!data?.question||busy)return;setBusy(true);setError('');try{await api('submit',{code:roomCode,visitorId:visitor,name:name.trim()||'Anonim',value});localStorage.setItem('insightlive_name',name.trim());setSent(true);await load(visitor)}catch(e){setError(e.message)}finally{setBusy(false)}}
 function move(pos,dir){setValue(current=>{const next=[...(current?.ranking||[])],target=pos+dir;if(target<0||target>=next.length)return current;[next[pos],next[target]]=[next[target],next[pos]];return {ranking:next}})}
 const q=data?.question,room=data?.room,answered=sent||data?.hasAnswered,open=room?.status==='open';
 const timer=data?.timer?clientTimer({...data.timer,client_offset_ms:data.server_offset_ms||0},clockNow):null;
 const mayAnswer=open&&(!timer||acceptsTimedAnswer(timer));
 const isValid=()=>{if(!q||!value)return false;if(['insight','wordcloud','open'].includes(q.type))return (value.text||'').trim().length>=2;if(q.type==='poll'&&q.config?.multiple)return Array.isArray(value.choices)&&value.choices.length>0;if(['poll','quiz'].includes(q.type))return Number.isInteger(value.choice);if(q.type==='scale')return Number.isInteger(value.rating);if(q.type==='ranking')return value.ranking?.length===q.options?.length;return false};
 return <main className="audience-page" data-theme={room?.theme||'violet'}><header className="audience-header"><Brand/><span className="room-label">ROOM <strong>{roomCode}</strong></span></header><div className="audience-content">
 {(!data||!room)?<div className="join-card center"><Loader2 size={28} className="spin"/><h2>Masuk ke sesi...</h2><p>{error||'Menghubungkan dengan room presenter.'}</p>{error&&<Link href="/" className="btn btn-outline">Kembali</Link>}</div>:<>
  <div className="audience-meta"><span className="eyebrow">{room.title}</span><span className="audience-status"><span className="pulse-dot"/>{open?'Sesi berlangsung':'Sesi ditutup'}</span></div>
  {!q?<div className="join-card center"><Clock3 size={40}/><h2>Menunggu pertanyaan</h2><p>Presenter sedang menyiapkan sesi. Halaman akan memperbarui secara otomatis.</p></div>:<div className="join-card"><div className="join-topline"><span className="join-type">{q.type==='insight'&&<Sparkles size={14}/>} {labelFor(q.type)}</span><ResultCount count={data.count}/></div><h1>{q.text}</h1><Countdown timer={data.timer?{...data.timer,client_offset_ms:data.server_offset_ms||0}:null}/>
   {!answered&&!mayAnswer?<div className="closed-alert"><Lock size={20}/><strong>{!open?'Jawaban sedang ditutup':timer?.status==='finished'?'Waktu menjawab habis':timer?.status==='paused'?'Timer sedang dijeda':'Menunggu timer dimulai'}</strong><p>{!open?'Silakan menunggu presenter membuka sesi kembali.':timer?.status==='finished'?'Waktu pertanyaan ini telah berakhir. Silakan menunggu instruksi presenter.':'Silakan menunggu presenter menjalankan timer.'}</p></div>:answered?<div className="submitted-state"><CheckCircle2 size={50}/><h2>Jawaban terkirim!</h2><p>Terima kasih. Tunggu pertanyaan berikutnya atau hasil dari presenter.</p><span>Halaman akan diperbarui otomatis.</span></div>:<form onSubmit={submit} className="answer-form"><label>Nama (opsional)</label><input maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama atau alias peserta"/>
    {['insight','open'].includes(q.type)&&<><label>Jawaban kamu</label><textarea required minLength={2} rows={5} maxLength={500} placeholder="Tulis pendapatmu di sini..." value={value?.text||''} onChange={e=>setValue({text:e.target.value})}/><div className="field-hint">Jawaban bebas · Maksimal 500 karakter</div></>}
    {q.type==='wordcloud'&&<><label>Masukkan 1–6 kata</label><input required minLength={2} maxLength={100} placeholder="Contoh: Kolaborasi, inovasi, data" value={value?.text||''} onChange={e=>setValue({text:e.target.value})}/></>}
    {['poll','quiz'].includes(q.type)&&<div className="answer-options">{(q.options||[]).map((opt,i)=><button key={i} type="button" className={`answer-option ${(q.type==='poll'&&q.config?.multiple?value?.choices?.includes(i):value?.choice===i)?'selected':''}`} onClick={()=>q.type==='poll'&&q.config?.multiple?setValue(current=>({choices:(current?.choices?.includes(i)?current.choices.filter(x=>x!==i):[...(current?.choices||[]),i])})):setValue({choice:i})}><span className="option-letter">{String.fromCharCode(65+i)}</span><strong>{opt}</strong><span className="option-radio">{(q.type==='poll'&&q.config?.multiple?value?.choices?.includes(i):value?.choice===i)&&<span/>}</span></button>)}</div>}
    {q.type==='scale'&&<><label>Berikan nilai</label><div className="scale-options">{Array.from({length:q.config?.max===10?10:5},(_,i)=>i+1).map(n=><button key={n} type="button" className={`scale-choice ${value?.rating===n?'selected':''}`} onClick={()=>setValue({rating:n})}>{n}</button>)}</div><div className="scale-labels"><span>Sangat rendah</span><span>Sangat tinggi</span></div></>}
    {q.type==='ranking'&&<><label>Urutkan dari prioritas tertinggi</label><div className="rank-input">{(value?.ranking||q.options.map((_,i)=>i)).map((idx,pos)=><div className="rank-input-row" key={idx}><span className="rank-badge">{pos+1}</span><strong>{q.options[idx]}</strong><div className="rank-buttons"><button type="button" aria-label="Naikkan" disabled={pos===0} onClick={()=>move(pos,-1)}><ChevronUp size={18}/></button><button type="button" aria-label="Turunkan" disabled={pos===q.options.length-1} onClick={()=>move(pos,1)}><ChevronDown size={18}/></button></div></div>)}</div></>}
    <button type="submit" className="btn btn-primary full submit-answer" disabled={busy||!isValid()}>{busy?<Loader2 className="spin" size={18}/>:<Send size={18}/>} {busy?'Mengirim...':'Kirim jawaban'} <ArrowRight size={18}/></button>
   </form>}
   {error&&<div className="notice error">{error}</div>}
  </div>}
  {q?.revealed&&<div className="join-card published-results"><div className="panel-head"><div><span className="eyebrow">RESULTS ARE IN</span><h2>Hasil dari audiens</h2></div></div><Results question={q} result={data.result}/></div>}
  <p className="audience-hint"><RefreshCw size={13}/> Otomatis diperbarui setiap 4 detik</p>
 </>}
 </div><footer className="audience-footer">Powered by <strong>insightlive</strong></footer></main>
}
