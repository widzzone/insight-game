import { NextResponse } from 'next/server';
import { AppError,assert,isAdmin,db,getRoom,protectQuestion } from '@/lib/server';
import { aggregate } from '@/lib/results';
import { timerState } from '@/lib/timer';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request){
  try{
    const url=new URL(request.url);
    const mode=url.searchParams.get('mode');
    if(mode==='session')return NextResponse.json({ok:true,admin:await isAdmin()},{headers:{'Cache-Control':'no-store'}});
    const code=String(url.searchParams.get('code')||'').trim().toUpperCase();
    const room=await getRoom(code);
    const admin=mode==='presenter'&&await isAdmin();
    if(mode==='presenter')assert(admin,'Silakan login sebagai presenter.',401);
    const questions=await db('questions',{filters:{room_code:`eq.${code}`},order:'ord.asc',limit:50});
    const q=questions.find(q=>q.id===room.active_question_id)||null;
    // Data jawaban tidak pernah diberikan ke publik saat hasil disembunyikan.
    const responses=q?await db('responses',{filters:{question_id:`eq.${q.id}`},order:'created_at.asc',limit:1000}):[];
    const revealed=!!q?.revealed;
    const result=(admin||revealed)&&q?aggregate(q,responses):null;
    let hasAnswered=false;
    const visitorId=url.searchParams.get('visitorId')||'';
    if(visitorId && /^[a-zA-Z0-9_-]{16,100}$/.test(visitorId))hasAnswered=responses.some(r=>r.visitor_id===visitorId);
    const data={ok:true,server_now:new Date().toISOString(),timer:q?timerState(q):null,room:{code:room.code,title:room.title,status:room.status,theme:room.theme,active_question_id:room.active_question_id},
      question:protectQuestion(q,admin||revealed),count:responses.length,result:revealed||admin?result:null,hasAnswered};
    if(admin){
      data.questions=questions.map(qq=>({id:qq.id,ord:qq.ord,text:qq.text,type:qq.type,options:qq.options,config:qq.config,revealed:qq.revealed,timer_seconds:qq.timer_seconds||0}));
      data.responses=responses.map(r=>({id:r.id,name:r.display_name,value:r.value,at:r.created_at})).reverse();
      data.admin=true;
    }
    return NextResponse.json(data,{headers:{'Cache-Control':'no-store, max-age=0'}});
  }catch(e){
    if(!(e instanceof AppError))console.error('API state error',e);
    return NextResponse.json({ok:false,error:e instanceof AppError?e.message:'Kesalahan server.'},{status:e instanceof AppError?e.status:500});
  }
}
