'use client';
import { Sparkles, Quote, Trophy, CircleCheck, Clock3 } from 'lucide-react';

export function Results({question, result, large=false}){
  if(!question)return <div className="empty-panel">Belum ada pertanyaan aktif.</div>;
  if(!result)return <div className="empty-panel"><Clock3 size={26}/><strong>Hasil masih disembunyikan</strong><span>Presenter akan menampilkan hasil setelah semua peserta menjawab.</span></div>;
  const {type,total}=result;
  if(type==='insight'){
    if(!result.analysis)return <div className="empty-panel"><Sparkles size={28}/><strong>Ringkasan belum dibuat</strong><span>{total} jawaban terkumpul · Presenter perlu klik Analisis jawaban.</span></div>;
    const analysis=result.analysis;
    const colors=['#7357e8','#24b4ac','#e6a352','#ef7b7c','#5d9ae7','#a18aef','#9ca3af'];
    return <div className="results-wrap">
      {result.stale&&<div className="notice amber">Ada jawaban baru sejak analisis terakhir. Klik “Analisis ulang” agar kategori diperbarui.</div>}
      <div className="ai-summary"><span className="eyebrow"><Sparkles size={15}/> RINGKASAN HASIL</span><p>{analysis.summary}</p><div className="ai-takeaway"><Quote size={17}/>{analysis.takeaway}</div></div>
      <div className="results-heading"><h3>Kelompok jawaban</h3><span>{result.analyzed_count} dianalisis</span></div>
      <div className="theme-list">{(analysis.categories||[]).map((c,i)=><div className="theme-item" key={i}>
        <div className="theme-row"><strong><i className="color-dot" style={{background:colors[i%colors.length]}}/>{c.name}</strong><span><b>{c.count}</b> · {Math.round(c.count/(result.analyzed_count||1)*100)}%</span></div>
        <div className="bar-track"><div className="bar-fill" style={{width:`${100*c.count/(result.analyzed_count||1)}%`,background:colors[i%colors.length]}}/></div>
        {!large&&c.examples?.[0]&&<div className="example">“{c.examples[0]}”</div>}
      </div>)}</div>
      <div className="footnote">Kategori dibuat dari isi jawaban dan dapat ditinjau kembali oleh presenter.</div>
    </div>
  }
  if(type==='wordcloud'){
    const words=result.words||[];
    if(!words.length)return <div className="empty-panel">Belum ada kata yang dapat ditampilkan.</div>;
    const max=Math.max(...words.map(w=>w.count),1);
    return <div className={`word-cloud ${large?'large':''}`}>{words.map((w,i)=><span key={w.word} style={{fontSize:`${(large?24:16)+Math.round((w.count/max)*(large?70:44))}px`,color:['#6e54dc','#1c8a9c','#e28c66','#7d80c8','#ca5790'][i%5],fontWeight:Math.round(600+(w.count/max)*200)}} title={`${w.count} kali`}>{w.word}</span>)}</div>;
  }
  if(type==='poll'||type==='quiz')return <div className="option-results">{result.items?.map((it,i)=><div className="option-result" key={i}>
    <div className="option-line"><span><b className="option-letter">{String.fromCharCode(65+i)}</b>{it.label}{type==='quiz'&&it.correct&&<CircleCheck className="correct-icon" size={18}/>}</span><strong>{it.pct}%</strong></div>
    <div className="bar-track"><div className={`bar-fill ${type==='quiz'&&it.correct?'bar-success':''}`} style={{width:`${it.pct}%`}}/></div>
    <span className="small-muted">{it.count} suara</span>
  </div>)}</div>;
  if(type==='scale')return <div className="scale-results"><div className="big-average"><strong>{Number(result.average||0).toLocaleString('id-ID',{minimumFractionDigits:1,maximumFractionDigits:2})}</strong><span>/ {result.max}</span><small>Rata-rata dari {total} respons</small></div><div className="histogram">{result.items?.map(it=><div className="hist-col" key={it.label}><span>{it.count||''}</span><div className="hist-bar" style={{height:`${Math.max(4,it.count/Math.max(1,...result.items.map(v=>v.count))*100)}%`}}/><b>{it.label}</b></div>)}</div></div>;
  if(type==='ranking')return <div className="ranking-results">{result.items?.map((it,i)=><div className="ranking-row" key={it.label}><span className="rank-badge">#{i+1}</span><span>{it.label}</span><strong>{it.score} poin</strong></div>)}<div className="footnote">Peringkat dihitung dengan skor Borda: posisi pertama memperoleh poin terbanyak.</div></div>;
  if(type==='open')return <div className="wall-grid">{(result.items||[]).map((it,i)=><div className="sticky-note" key={i}><p>{it.text}</p><small>— {it.name}</small></div>)}</div>;
  return <div className="empty-panel">Belum ada hasil.</div>;
}

export function ResultCount({count}){return <span className="count-chip"><span className="pulse-dot"/>{count} jawaban</span>}
