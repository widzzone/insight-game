import { NextResponse } from 'next/server';
import { AppError,assert,cleanText,safeEqual,requireConfig,requireAdmin,isAdmin,setAdminCookie,clearAdminCookie,db,getRoom,getQuestion,getActiveQuestion,newCode } from '@/lib/server';
import { needsOptions } from '@/lib/catalog';
import { analyzeWithGemini } from '@/lib/gemini';
import { timerState, acceptsTimedAnswer } from '@/lib/timer';

export const runtime='nodejs';
export const maxDuration=60;
const ok=(data={})=>NextResponse.json({ok:true,...data},{headers:{'Cache-Control':'no-store'}});
const fail=(err)=>{
  if(!(err instanceof AppError))console.error('API action failed',err);
  return NextResponse.json({ok:false,error:err instanceof AppError?err.message:'Terjadi kesalahan server.'},{status:err instanceof AppError?err.status:500});
};
function parseQuestion(body){
  const type=String(body.type||'');
  assert(['insight','wordcloud','poll','quiz','scale','open','ranking'].includes(type),'Tipe pertanyaan tidak valid.');
  const text=cleanText(body.text,400);
  assert(text.length>=5,'Pertanyaan minimal 5 karakter.');
  let options=[];
  if(needsOptions(type)){
    assert(Array.isArray(body.options),'Pilihan harus berupa daftar.');
    options=body.options.map(x=>cleanText(x,90)).filter(Boolean);
    assert(options.length>=2&&options.length<=8,'Isi 2 hingga 8 opsi pilihan.');
    assert(new Set(options.map(x=>x.toLowerCase())).size===options.length,'Tidak boleh ada pilihan duplikat.');
  }
  const config={};
  if(type==='scale')config.max=Number(body.max)===10?10:5;
  if(type==='poll')config.multiple=!!body.multiple;
  if(type==='quiz'){
    const correct=Number(body.correct);
    assert(Number.isInteger(correct)&&correct>=0&&correct<options.length,'Pilih kunci jawaban kuis.');
    config.correct=correct;
  }
  const timer_seconds=Number(body.timer_seconds??0);
  assert(Number.isInteger(timer_seconds)&&timer_seconds>=0&&timer_seconds<=3600,'Durasi timer harus 0 hingga 3600 detik.');
  return {text,type,options,config,timer_seconds};
}
function validateAnswer(q,value){
  assert(value&&typeof value==='object'&&!Array.isArray(value),'Jawaban tidak valid.');
  if(['open','insight','wordcloud'].includes(q.type)){
    const text=cleanText(value.text,q.type==='wordcloud'?100:500);
    assert(text.length>=2,'Jawaban minimal 2 karakter.');
    if(q.type==='wordcloud')assert((text.split(/\s+/).filter(Boolean).length)<=6,'Word cloud maksimal 6 kata.');
    return {text};
  }
  if(q.type==='poll' && q.config?.multiple){
    const choices=value.choices;
    assert(Array.isArray(choices)&&choices.length>=1&&choices.length<=q.options.length&&new Set(choices).size===choices.length&&choices.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length),'Pilih satu atau beberapa opsi valid.');
    return {choices};
  }
  if(['poll','quiz'].includes(q.type)){
    assert(Number.isInteger(value.choice)&&value.choice>=0&&value.choice<q.options.length,'Pilih salah satu jawaban.');
    return {choice:value.choice};
  }
  if(q.type==='scale'){
    assert(Number.isInteger(value.rating)&&value.rating>=1&&value.rating<=(q.config?.max===10?10:5),'Skala jawaban di luar rentang.');
    return {rating:value.rating};
  }
  if(q.type==='ranking'){
    const ranking=value.ranking;
    assert(Array.isArray(ranking)&&ranking.length===q.options.length&&new Set(ranking).size===q.options.length,'Lengkapi urutan prioritas.');
    assert(ranking.every(v=>Number.isInteger(v)&&v>=0&&v<q.options.length),'Nilai ranking tidak valid.');
    return {ranking};
  }
  throw new AppError('Tipe jawaban tidak didukung.');
}
export async function POST(request){
  try{
    const origin=request.headers.get('origin');
    if(origin&&new URL(origin).host!==new URL(request.url).host)throw new AppError('Permintaan dari domain lain ditolak.',403);
    const raw=await request.text();
    assert(raw.length<24000,'Ukuran permintaan terlalu besar.',413);
    let b;try{b=JSON.parse(raw)}catch{throw new AppError('Format permintaan tidak valid.');}
    const action=String(b.action||'');
    if(action==='login'){
      requireConfig();
      assert(safeEqual(String(b.pin||''),process.env.ADMIN_PIN),'PIN presenter tidak sesuai.',401);
      await setAdminCookie();return ok({admin:true});
    }
    if(action==='logout') {await clearAdminCookie();return ok();}
    if(action==='submit'){
      const code=String(b.code||'').trim().toUpperCase(),visitorId=String(b.visitorId||'');
      assert(/^[a-zA-Z0-9_-]{16,100}$/.test(visitorId),'ID peserta tidak valid. Refresh halaman.');
      const room=await getRoom(code);
      assert(room.status==='open','Sesi sudah ditutup.');
      const q=await getActiveQuestion(room);
      assert(acceptsTimedAnswer(timerState(q)),'Waktu menjawab belum dimulai, dijeda, atau sudah habis.');
      const value=validateAnswer(q,b.value);
      const name=cleanText(b.name||'Anonim',60)||'Anonim';
      await db('responses',{method:'POST',body:{question_id:q.id,room_code:room.code,visitor_id:visitorId,display_name:name,value}});
      return ok({message:'Jawaban berhasil dikirim.'});
    }
    await requireAdmin();
    if(action==='createRoom'){
      const title=cleanText(b.title,100);
      assert(title.length>=3,'Judul sesi minimal 3 karakter.');
      let room;
      for(let i=0;i<7;i++){
        try{
          const code=newCode();
          const data=await db('rooms',{method:'POST',body:{code,title,theme:['violet','blue','teal','coral','amber'].includes(b.theme)?b.theme:'violet'}});
          room=data[0];break;
        }catch(e){if(e.status===409)continue;throw e;}
      }
      assert(room,'Tidak dapat membuat room unik. Coba lagi.',500);
      return ok({code:room.code});
    }
    const code=String(b.code||'').trim().toUpperCase();
    const room=await getRoom(code);
    if(action==='addQuestion'){
      const question=parseQuestion(b);
      const existing=await db('questions',{filters:{room_code:`eq.${code}`},order:'ord.desc',limit:1});
      assert((existing?.[0]?.ord||0)<50,'Maksimal 50 pertanyaan per sesi.');
      const q=(await db('questions',{method:'POST',body:{room_code:code,...question,timer_ends_at:null,timer_remaining_seconds:null,ord:(existing?.[0]?.ord||0)+1}}))[0];
      if(!room.active_question_id)await db('rooms',{method:'PATCH',filters:{code:`eq.${code}`},body:{active_question_id:q.id}});
      return ok({id:q.id});
    }
    if(action==='editQuestion'){
      const q=await getQuestion(String(b.questionId||''),code);
      const answers=await db('responses',{filters:{question_id:`eq.${q.id}`},select:'id',limit:1});
      assert(!answers.length,'Pertanyaan yang sudah dijawab tidak bisa diedit. Buat pertanyaan baru.');
      const changes=parseQuestion(b);
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{...changes,timer_ends_at:null,timer_remaining_seconds:null}});return ok();
    }
    if(action==='activate'){
      const q=await getQuestion(String(b.questionId||''),code);
      // Pertanyaan yang diaktifkan dimulai dengan timer penuh, tidak meneruskan timer lama.
      if(room.active_question_id && room.active_question_id!==q.id){
        await db('questions',{method:'PATCH',filters:{id:`eq.${room.active_question_id}`},body:{timer_ends_at:null,timer_remaining_seconds:null}});
      }
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{timer_ends_at:null,timer_remaining_seconds:null}});
      await db('rooms',{method:'PATCH',filters:{code:`eq.${code}`},body:{active_question_id:q.id}});
      return ok();
    }
    if(action==='setTimerDuration'){
      const q=await getActiveQuestion(room);
      const seconds=Number(b.timer_seconds);
      assert(Number.isInteger(seconds)&&seconds>=0&&seconds<=3600,'Durasi timer harus 0 hingga 3600 detik.');
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{timer_seconds:seconds,timer_ends_at:null,timer_remaining_seconds:null}});
      return ok();
    }
    if(action==='startTimer'){
      const q=await getActiveQuestion(room);
      const timer=timerState(q);
      assert(timer.status==='ready'||timer.status==='paused','Timer tidak siap dijalankan. Gunakan Ulangi untuk memulai dari awal.');
      const ends_at=new Date(Date.now()+timer.remaining*1000).toISOString();
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{timer_ends_at:ends_at,timer_remaining_seconds:null}});return ok();
    }
    if(action==='pauseTimer'){
      const q=await getActiveQuestion(room);
      const timer=timerState(q);
      assert(timer.status==='running','Timer sedang tidak berjalan.');
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{timer_ends_at:null,timer_remaining_seconds:timer.remaining}});return ok();
    }
    if(action==='resetTimer'){
      const q=await getActiveQuestion(room);
      assert(q.timer_seconds>0,'Timer belum diaktifkan untuk pertanyaan ini.');
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{timer_ends_at:null,timer_remaining_seconds:null}});return ok();
    }
    if(action==='toggleRoom'){
      await db('rooms',{method:'PATCH',filters:{code:`eq.${code}`},body:{status:b.open?'open':'closed'}});return ok();
    }
    if(action==='toggleReveal'){
      const q=await getActiveQuestion(room);
      if(b.revealed&&q.type==='insight'){
        assert(q.analysis,'Buat ringkasan jawaban sebelum menampilkan hasil.');
      }
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{revealed:!!b.revealed}});return ok();
    }
    if(action==='setTheme'){
      assert(['violet','blue','teal','coral','amber'].includes(b.theme),'Tema tidak valid.');
      await db('rooms',{method:'PATCH',filters:{code:`eq.${code}`},body:{theme:b.theme}});return ok();
    }
    if(action==='analyze'){
      const q=await getActiveQuestion(room);
      assert(q.type==='insight','Analisis jawaban hanya tersedia untuk tipe Insight.');
      const answers=await db('responses',{filters:{question_id:`eq.${q.id}`},order:'created_at.asc',limit:301});
      assert(answers.length>0,'Belum ada jawaban.');
      assert(answers.length<=300,'Batas 300 jawaban untuk analisis sekali jalan.');
      const analysis=await analyzeWithGemini(q,answers);
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{analysis,analyzed_count:answers.length}});
      return ok({analysis});
    }
    if(action==='deleteQuestion'){
      const q=await getQuestion(String(b.questionId||''),code);
      assert(room.active_question_id!==q.id,'Pertanyaan aktif tidak dapat dihapus. Aktifkan pertanyaan lain dahulu.');
      await db('questions',{method:'DELETE',filters:{id:`eq.${q.id}`},prefer:'return=minimal'});return ok();
    }
    if(action==='resetQuestion'){
      const q=await getQuestion(String(b.questionId||''),code);
      await db('responses',{method:'DELETE',filters:{question_id:`eq.${q.id}`},prefer:'return=minimal'});
      await db('questions',{method:'PATCH',filters:{id:`eq.${q.id}`},body:{analysis:null,analyzed_count:0,revealed:false,timer_ends_at:null,timer_remaining_seconds:null}});
      return ok();
    }
    throw new AppError('Aksi tidak dikenali.',404);
  }catch(e){return fail(e)}
}
