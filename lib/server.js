import { createHmac, timingSafeEqual, randomInt } from 'node:crypto';
import { cookies } from 'next/headers';

export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const cleanText = (text, max) => String(text ?? '').trim().slice(0,max);
export function assert(condition, message, status=400) {if (!condition) throw new AppError(message,status);}
export function safeEqual(a,b) {
  const aa=createHmac('sha256','constant').update(String(a)).digest();
  const bb=createHmac('sha256','constant').update(String(b)).digest();
  return timingSafeEqual(aa,bb);
}
const secret=()=>process.env.COOKIE_SECRET || '';
function signedToken() { return createHmac('sha256',secret()).update('presenter-session-v1').digest('hex'); }
export async function isAdmin() {
  if (!secret() || secret().length<32) return false;
  return safeEqual((await cookies()).get('il_presenter')?.value || '', signedToken());
}
export function requireConfig() {
  assert(process.env.ADMIN_PIN?.length >= 8, 'ADMIN_PIN belum dikonfigurasi (minimal 8 karakter).',500);
  assert(secret().length >= 32, 'COOKIE_SECRET belum dikonfigurasi (minimal 32 karakter).',500);
}
export async function requireAdmin() { assert(await isAdmin(),'Akses presenter berakhir. Silakan login kembali.',401); }
export async function setAdminCookie() {
  const store=await cookies();
  store.set('il_presenter',signedToken(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:60*60*12,path:'/'});
}
export async function clearAdminCookie() { (await cookies()).delete('il_presenter'); }

function dbConfig() {
  const host=process.env.SUPABASE_URL || '';
  const key=process.env.SUPABASE_SECRET_KEY || '';
  assert(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(host)&&key,'SUPABASE_URL atau SUPABASE_SECRET_KEY belum dikonfigurasi.',500);
  return {host:host.replace(/\/$/,''),key};
}
export async function db(table,{filters={},method='GET',body,select='*',order,limit,prefer}={}) {
  const {host,key}=dbConfig();
  const url=new URL(`${host}/rest/v1/${table}`);
  if (method==='GET' || method==='POST') url.searchParams.set('select',select);
  for (const [k,v] of Object.entries(filters)) url.searchParams.set(k,v);
  if (order) url.searchParams.set('order',order);
  if (limit) url.searchParams.set('limit',String(limit));
  const headers={'apikey':key,'Content-Type':'application/json'};
  // Kunci sb_secret tidak boleh digunakan sebagai Bearer token.
  if (!key.startsWith('sb_secret_')) headers.Authorization=`Bearer ${key}`;
  if (prefer || method!=='GET') headers.Prefer=prefer || 'return=representation';
  const response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(16000)});
  const data=await response.text();
  const parsed=data?(()=>{try{return JSON.parse(data)}catch{return {message:data}}})():[];
  if (!response.ok) {
    if (response.status===409 || parsed?.code==='23505') throw new AppError(table==='responses'?'Jawaban untuk pertanyaan ini sudah pernah dikirim.':'Data dengan identitas sama sudah tersedia.',409);
    console.error('DB ERROR', response.status, parsed?.code, parsed?.message);
    throw new AppError('Gagal mengakses database. Periksa skema dan konfigurasi Supabase.',500);
  }
  return parsed;
}
export async function getRoom(code){
  assert(/^[A-Z0-9]{6}$/.test(code),'Kode room tidak valid.');
  const rooms=await db('rooms',{filters:{code:`eq.${code}`}});
  assert(rooms.length,'Room tidak ditemukan.',404);
  return rooms[0];
}
export async function getQuestion(id,roomCode) {
  const qs=await db('questions',{filters:{id:`eq.${id}`,room_code:`eq.${roomCode}`}});
  assert(qs.length,'Pertanyaan tidak ditemukan.',404);
  return qs[0];
}
export async function getActiveQuestion(room){
  assert(room.active_question_id,'Belum ada pertanyaan aktif.',404);
  return getQuestion(room.active_question_id,room.code);
}
export function newCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>chars[randomInt(chars.length)]).join('');
}
export function protectQuestion(q,showAnswers){
  if (!q) return null;
  const config={...(q.config||{})};
  if (q.type==='quiz'&&!showAnswers) delete config.correct;
  return {id:q.id,room_code:q.room_code,text:q.text,type:q.type,options:q.options,config,ord:q.ord,revealed:q.revealed};
}
