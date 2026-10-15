import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
for(const path of ['lib/server.js','lib/gemini.js','lib/results.js','lib/client.js','lib/catalog.js','lib/timer.js','app/api/action/route.js','app/api/state/route.js']){
  execFileSync(process.execPath,['--check',join(root,path)],{stdio:'pipe'});
}
// Menguji logika yang tidak membutuhkan Next.js, Supabase, atau API key.
const src=readFileSync(join(root,'lib/results.js'),'utf8');
const {aggregate}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const mk=(value,name='Peserta')=>({value,display_name:name});
const poll=aggregate({type:'poll',options:['A','B'],config:{}},[mk({choice:0}),mk({choice:1}),mk({choice:0})]);
assert.equal(poll.items[0].count,2);assert.equal(poll.items[0].pct,67);
const multi=aggregate({type:'poll',options:['A','B'],config:{multiple:true}},[mk({choices:[0,1]}),mk({choices:[1]})]);
assert.equal(multi.items[1].count,2);assert.equal(multi.items[0].pct,50);
const quiz=aggregate({type:'quiz',options:['A','B'],config:{correct:1}},[mk({choice:1})]);
assert.equal(quiz.items[1].correct,true);
const scale=aggregate({type:'scale',options:[],config:{max:5}},[mk({rating:5}),mk({rating:3})]);
assert.equal(scale.average,4);
const ranking=aggregate({type:'ranking',options:['A','B','C'],config:{}},[mk({ranking:[1,0,2]}),mk({ranking:[1,2,0]})]);
assert.equal(ranking.items[0].label,'B');
const wc=aggregate({type:'wordcloud',options:[],config:{}},[mk({text:'data data integrasi'}),mk({text:'integrasi data'})]);
assert.equal(wc.words[0].word,'data');assert.equal(wc.words[0].count,3);
const open=aggregate({type:'open',options:[],config:{}},[mk({text:'Ide A'})]);
assert.equal(open.items[0].text,'Ide A');
const insight=aggregate({type:'insight',analysis:{categories:[]},analyzed_count:1},[mk({text:'jawaban1'}),mk({text:'jawaban2'})]);
assert.equal(insight.stale,true);
// Pengujian logika timer menggunakan jam simulasi (tanpa Supabase).
const timerSrc=readFileSync(join(root,'lib/timer.js'),'utf8');
const {timerState,clientTimer,formatCountdown,acceptsTimedAnswer}=await import('data:text/javascript;base64,'+Buffer.from(timerSrc).toString('base64'));
const baseline=Date.parse('2026-10-15T10:00:00.000Z');
const timerQuestion={timer_seconds:60,timer_ends_at:null,timer_remaining_seconds:null};
assert.equal(timerState(timerQuestion,baseline).status,'ready');
assert.equal(acceptsTimedAnswer(timerState(timerQuestion,baseline)),false);
assert.equal(acceptsTimedAnswer(timerState({timer_seconds:0},baseline)),true);
const ticking={...timerQuestion,timer_ends_at:new Date(baseline+60000).toISOString()};
assert.equal(timerState(ticking,baseline+30000).remaining,30);
assert.equal(timerState(ticking,baseline+30000).status,'running');
assert.equal(acceptsTimedAnswer(timerState(ticking,baseline+30000)),true);
assert.equal(timerState(ticking,baseline+60000).status,'finished');
assert.equal(acceptsTimedAnswer(timerState(ticking,baseline+60000)),false);
assert.equal(timerState({...timerQuestion,timer_remaining_seconds:22},baseline).status,'paused');
assert.equal(clientTimer({status:'running',duration:60,ends_at:ticking.timer_ends_at},baseline+15000).remaining,45);
assert.equal(formatCountdown(65),'01:05');
console.log('✓ 8 source files passed node --check');
console.log('✓ 8 aggregation checks passed');

console.log('✓ 9 timer behavior checks passed');
