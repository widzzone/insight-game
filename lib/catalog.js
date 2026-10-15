export const QUESTION_TYPES = [
  {id:'insight', title:'AI Insight', icon:'Sparkles', desc:'AI mengelompokkan jawaban berdasarkan makna', sample:'Apa inti pesan dari slide ini?'},
  {id:'wordcloud', title:'Word Cloud', icon:'Cloud', desc:'Kata yang sering disebut tampil lebih besar', sample:'Satu kata untuk menggambarkan presentasi ini?'},
  {id:'poll', title:'Multiple Choice', icon:'BarChart3', desc:'Polling pilihan dengan grafik persentase', sample:'Prioritas mana yang paling penting?'},
  {id:'quiz', title:'Quiz', icon:'Trophy', desc:'Pertanyaan pilihan ganda dengan kunci jawaban', sample:'Apa jawaban yang paling tepat?'},
  {id:'scale', title:'Rating Scale', icon:'SlidersHorizontal', desc:'Nilai 1–5 atau 1–10 dengan rata-rata', sample:'Seberapa paham Anda terhadap materi?'},
  {id:'open', title:'Open Wall', icon:'MessagesSquare', desc:'Jawaban bebas tampil seperti sticky notes', sample:'Apa masukan Anda untuk sesi ini?'},
  {id:'ranking', title:'Ranking', icon:'ListOrdered', desc:'Peserta mengurutkan prioritas pilihan', sample:'Urutkan inisiatif dari yang paling penting'}
];
export const THEMES = ['violet','blue','teal','coral','amber'];
export const labelFor = id => QUESTION_TYPES.find(x=>x.id === id)?.title || id;
export const needsOptions = t => ['poll','quiz','ranking'].includes(t);
