// Referensi JS atas formula yang juga ditegakkan oleh trigger Supabase.
// Poin yang digunakan secara nyata selalu berasal dari database.
export function previewQuizScore({correct,durationSeconds=0,remainingMs=0}) {
  if(!correct)return 0;
  const duration=Number(durationSeconds)*1000;
  if(!(duration>0))return 1000;
  const remaining=Math.min(duration,Math.max(0,Number(remainingMs)||0));
  return 1000+Math.round(500*remaining/duration);
}
