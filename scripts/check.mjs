import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
for(const path of ['lib/server.js','lib/gemini.js','lib/results.js','lib/client.js','lib/catalog.js','app/api/action/route.js','app/api/state/route.js']){
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
console.log('✓ 7 source files passed node --check');
console.log('✓ 8 aggregation checks passed');
