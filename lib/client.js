export async function api(action,payload={}) {
  const res=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error(data.error||'Server gagal memproses permintaan.');
  return data;
}
export async function state(code,options={}) {
  const params=new URLSearchParams({code,...options});
  const res=await fetch(`/api/state?${params}`,{cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error(data.error||'Gagal mengambil data.');
  return data;
}
export function getVisitorId() {
  if(typeof window==='undefined')return '';
  const key='insight_live_visitor_v2';
  let id=localStorage.getItem(key);
  if(!id){id=crypto.randomUUID().replaceAll('-','');localStorage.setItem(key,id)}
  return id;
}
export function getOrigin(){return typeof window==='undefined'?'':window.location.origin}
