// Semua waktu dihitung dari timestamp server. Browser hanya menampilkan countdown.
export function timerState(question, now=Date.now()) {
  if (!question || !Number(question.timer_seconds)) return {status:'disabled',duration:0,remaining:0,ends_at:null};
  const duration=Math.max(0,Number(question.timer_seconds)||0);
  const end=question.timer_ends_at ? Date.parse(question.timer_ends_at) : null;
  if(end && Number.isFinite(end)) {
    const remaining=Math.max(0,Math.ceil((end-now)/1000));
    return {status:remaining>0?'running':'finished',duration,remaining,ends_at:question.timer_ends_at};
  }
  const saved=question.timer_remaining_seconds;
  if(saved!==null && saved!==undefined) {
    const remaining=Math.max(0,Number(saved)||0);
    return {status:remaining>0?'paused':'finished',duration,remaining,ends_at:null};
  }
  return {status:'ready',duration,remaining:duration,ends_at:null};
}
export function clientTimer(timer, now=Date.now()) {
  if(!timer) return {status:'disabled',duration:0,remaining:0};
  if(timer.status==='running' && timer.ends_at) {
    // Offset terhadap jam server untuk membantu jika jam HP peserta meleset.
    const offset=Number(timer.client_offset_ms)||0;
    const remaining=Math.max(0,Math.ceil((Date.parse(timer.ends_at)-(now+offset))/1000));
    return {...timer,status:remaining>0?'running':'finished',remaining};
  }
  return timer;
}
export function formatCountdown(seconds) {
  const s=Math.max(0,Math.ceil(seconds||0));
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
export function acceptsTimedAnswer(timer) {
  return timer.status==='disabled' || (timer.status==='running' && timer.remaining>0);
}
