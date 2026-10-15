'use client';
import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { clientTimer, formatCountdown } from '@/lib/timer';

const descriptions={ready:'Belum dimulai',running:'Sedang berjalan',paused:'Dijeda',finished:'Waktu habis'};
export default function Countdown({timer,large=false}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const ticker=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(ticker)},[]);
  if(!timer||timer.status==='disabled')return null;
  const live=clientTimer(timer,now);
  const percent=Math.max(0,Math.min(100,live.remaining/(live.duration||1)*100));
  return <div className={`countdown ${large?'countdown-large':''} timer-${live.status} ${live.status==='running'&&live.remaining<=10?'timer-urgent':''}`} role="timer" aria-label={`Sisa waktu ${formatCountdown(live.remaining)}`}>
    <div className="countdown-heading"><Clock3 size={large?24:19}/><span>Waktu menjawab</span></div>
    <strong className="countdown-digits">{formatCountdown(live.remaining)}</strong>
    <div className="countdown-track"><span style={{width:`${percent}%`}}/></div>
    <small>{descriptions[live.status]||'Timer'}</small>
  </div>;
}
