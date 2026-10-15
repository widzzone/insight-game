const IGNORE=new Set('yang dan atau dari untuk dengan pada ini itu adalah sudah telah agar juga dalam ketika maka sebuah satu suatu kita saya anda mereka oleh karena lebih bisa akan harus sangat saja ada apa mana jadi tentang serta atapun di ke se sebagai nya the and for a an of in it is to'.split(' '));
export function aggregate(question,responses) {
  const type=question.type;
  const values=responses.map(r=>r.value);
  const options=Array.isArray(question.options)?question.options:[];
  if (type==='poll'||type==='quiz') {
    const counts=options.map(()=>0);
    values.forEach(v=>{
      const picks=type==='poll'&&question.config?.multiple?v?.choices:[v?.choice];
      if(!Array.isArray(picks))return;
      for(const idx of new Set(picks)){if(Number.isInteger(idx)&&idx>=0&&idx<counts.length)counts[idx]++}
    });
    return {type,total:responses.length,multiple:!!(type==='poll'&&question.config?.multiple),items:options.map((label,i)=>({label,count:counts[i],pct:responses.length?Math.round(counts[i]/responses.length*100):0,correct:type==='quiz'&&i===question.config?.correct}))};
  }
  if (type==='scale') {
    const max=question.config?.max===10?10:5;
    const counts=Array.from({length:max},(_,i)=>({label:String(i+1),count:0}));
    let sum=0,n=0;
    values.forEach(v=>{if(Number.isInteger(v?.rating)&&v.rating>=1&&v.rating<=max){counts[v.rating-1].count++;sum+=v.rating;n++}});
    return {type,total:responses.length,max,average:n?+(sum/n).toFixed(2):0,items:counts};
  }
  if (type==='wordcloud') {
    const freq=new Map();
    for (const v of values) {
      const words=String(v?.text||'').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[];
      for(const word of words.slice(0,30)){
        if(word.length<2||IGNORE.has(word))continue;
        freq.set(word,(freq.get(word)||0)+1);
      }
    }
    return {type,total:responses.length,words:[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([word,count])=>({word,count}))};
  }
  if(type==='ranking'){
    const scores=options.map(()=>0), votes=options.map(()=>0);
    values.forEach(v=>{
      if(!Array.isArray(v?.ranking)||v.ranking.length!==options.length||new Set(v.ranking).size!==options.length)return;
      v.ranking.forEach((idx,rank)=>{if(Number.isInteger(idx)&&idx>=0&&idx<options.length){scores[idx]+=options.length-rank;votes[idx]++}});
    });
    return {type,total:responses.length,items:options.map((label,i)=>({label,score:scores[i],votes:votes[i]})).sort((a,b)=>b.score-a.score)};
  }
  if(type==='open')return {type,total:responses.length,items:responses.slice(-120).reverse().map(r=>({name:r.display_name,text:String(r.value?.text||'').slice(0,500)}))};
  if(type==='insight')return {type,total:responses.length,analysis:question.analysis||null,analyzed_count:question.analyzed_count||0,stale:(question.analyzed_count||0)!==responses.length};
  return {type,total:responses.length};
}
