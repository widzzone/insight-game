'use client';
import { Crown, Medal, Trophy } from 'lucide-react';
export default function Leaderboard({rows=[],heading='Leaderboard Quiz Battle',projection=false,selfName=''}){
  const sorted=(rows||[]).slice(0,projection?8:50);
  return <section className={`leaderboard ${projection?'leaderboard-projection':''}`} aria-label={heading}>
    <div className="leaderboard-heading"><div><span className="eyebrow"><Trophy size={14}/> QUIZ BATTLE</span><h3>{heading}</h3></div><span className="badge-neutral">{rows.length} peserta</span></div>
    {!sorted.length?<div className="empty-panel"><Medal size={27}/><b>Belum ada skor</b><span>Skor muncul setelah peserta menjawab pertanyaan Quiz.</span></div>:<div className="leaderboard-list">
      {sorted.map((entry,i)=><div className={`leaderboard-row ${i===0?'leaderboard-first':''}`} key={entry.visitor_id||`${entry.place}-${entry.display_name}`}>
        <span className="leaderboard-position">{i===0?<Crown size={21}/>:String(entry.place||i+1).padStart(2,'0')}</span>
        <div className="leaderboard-name"><strong>{entry.display_name||'Peserta'}</strong><small>{entry.correct_count||0} benar · {entry.answered_count||0} ronde</small></div>
        <strong className="leaderboard-score">{Number(entry.total_points||0).toLocaleString('id-ID')} <small>poin</small></strong>
      </div>)}
    </div>}
    <p className="leaderboard-note">Peringkat: poin tertinggi, lalu jumlah benar dan kecepatan rata-rata. Nama peserta terlihat oleh audiens saat hasil Quiz dipublikasikan.</p>
  </section>;
}
