/* eslint-disable */
const {useState,useEffect,useRef,useMemo}=React;
const BASE_COL_W=140,BASE_SLOT_H=48,TIME_W=52,OVR_PAD=4,UNDO_LIMIT=20;
const DAY_NAMES=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
const MONTHS=[
  {key:"gen-26",label:"Gennaio 2026",year:2026,month:0,days:31},{key:"feb-26",label:"Febbraio 2026",year:2026,month:1,days:28},{key:"mar-26",label:"Marzo 2026",year:2026,month:2,days:31},{key:"apr-26",label:"Aprile 2026",year:2026,month:3,days:30},{key:"mag-26",label:"Maggio 2026",year:2026,month:4,days:31},{key:"giu-26",label:"Giugno 2026",year:2026,month:5,days:30},{key:"lug-26",label:"Luglio 2026",year:2026,month:6,days:31},{key:"ago-26",label:"Agosto 2026",year:2026,month:7,days:31},{key:"set-26",label:"Settembre 2026",year:2026,month:8,days:30},{key:"ott-26",label:"Ottobre 2026",year:2026,month:9,days:31},{key:"nov-26",label:"Novembre 2026",year:2026,month:10,days:30},{key:"dic-26",label:"Dicembre 2026",year:2026,month:11,days:31},
  {key:"gen-27",label:"Gennaio 2027",year:2027,month:0,days:31},{key:"feb-27",label:"Febbraio 2027",year:2027,month:1,days:28},{key:"mar-27",label:"Marzo 2027",year:2027,month:2,days:31},{key:"apr-27",label:"Aprile 2027",year:2027,month:3,days:30},{key:"mag-27",label:"Maggio 2027",year:2027,month:4,days:31},{key:"giu-27",label:"Giugno 2027",year:2027,month:5,days:30},{key:"lug-27",label:"Luglio 2027",year:2027,month:6,days:31},{key:"ago-27",label:"Agosto 2027",year:2027,month:7,days:31},{key:"set-27",label:"Settembre 2027",year:2027,month:8,days:30},{key:"ott-27",label:"Ottobre 2027",year:2027,month:9,days:31},{key:"nov-27",label:"Novembre 2027",year:2027,month:10,days:30},{key:"dic-27",label:"Dicembre 2027",year:2027,month:11,days:31},
];
const MONTH_NAMES_SHORT=["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const MONTH_ABBR_IT=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const PALETTE=["#EC7A26","#3E6FB8","#2F8F5B","#C0392B","#9B59B6","#16A085","#E67E22","#34495E","#D35400","#27AE60","#8E44AD","#2980B9","#e74c3c","#f1c40f","#1abc9c","#3498db","#e91e63","#673ab7","#2196f3","#00bcd4","#4caf50","#ff9800","#ff5722","#795548","#607d8b","#f06292","#ba68c8","#4db6ac","#4fc3f7","#aed581","#ffb74d","#ff8a65","#a1887f","#90a4ae","#80cbc4","#ce93d8","#ef9a9a","#80deea","#c5e1a5","#ffe082"];
const ZOOM_LEVELS=[0.6,0.8,1,1.25,1.5,2,2.5,3];
const AV_STATI=["In corso","Concluso","Sospeso"];
const STATO_TONES={"In corso":"success","Concluso":"info","Sospeso":"warning"};
const LOG_TYPE_LABELS={
  add_tut:       <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="plus" size={13} color="var(--success)"/>Slot tutoraggio</span>,
  edit_tut:      <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="edit" size={13} color="var(--info)"/>Slot tutoraggio</span>,
  delete_tut:    <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="trash" size={13} color="var(--danger)"/>Slot tutoraggio</span>,
  add_corso:        <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="plus" size={13} color="var(--success)"/>Slot corso</span>,
  edit_corso:       <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="edit" size={13} color="var(--info)"/>Slot corso</span>,
  delete_corso:     <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="trash" size={13} color="var(--danger)"/>Slot corso</span>,
  add_tutor_ana: <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="plus" size={13} color="var(--success)"/>Tutor anagrafica</span>,
  edit_tutor_ana:<span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="edit" size={13} color="var(--info)"/>Tutor anagrafica</span>,
  delete_tutor_ana:<span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="trash" size={13} color="var(--danger)"/>Tutor anagrafica</span>,
  add_corso_ana:    <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="plus" size={13} color="var(--success)"/>Corso anagrafica</span>,
  edit_corso_ana:   <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="edit" size={13} color="var(--info)"/>Corso anagrafica</span>,
  delete_corso_ana: <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="trash" size={13} color="var(--danger)"/>Corso anagrafica</span>,
  add_avviso_ana: <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="plus" size={13} color="var(--success)"/>Avviso anagrafica</span>,
  edit_avviso_ana:<span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="edit" size={13} color="var(--info)"/>Avviso anagrafica</span>,
  delete_avviso_ana:<span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="trash" size={13} color="var(--danger)"/>Avviso anagrafica</span>,
  verify_tut:    <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="shieldCheck" size={13} color="var(--success)"/>Slot tutoraggio verificato</span>,
  unverify_tut:  <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="shield" size={13} color="var(--fg-muted)"/>Verifica rimossa (tutoraggio)</span>,
  verify_corso:  <span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="shieldCheck" size={13} color="var(--success)"/>Slot corso verificato</span>,
  unverify_corso:<span style={{display:"flex",alignItems:"center",gap:5}}><Icon name="shield" size={13} color="var(--fg-muted)"/>Verifica rimossa (corso)</span>,
};
const ROLE_LABEL={superadmin:"Super Admin",admin:"Admin",user:"Utente",viewer:"Viewer"};
const ROLE_ICON={superadmin:"star",admin:"shieldCheck",user:"user",viewer:"eye"};
const ROLE_COLOR={superadmin:"var(--danger)",admin:"var(--accent-strong)",user:"var(--info)",viewer:"var(--fg-subtle)"};
const VERIFICA_CATEGORIES=[
  {id:"sovrapposizione",label:"Sovrapposizioni",icon:"zap",color:"var(--danger)"},
  {id:"fuori_orario",label:"Fuori orario",icon:"clock",color:"var(--warning)"},
  {id:"fuori_giorno",label:"Fuori giorno",icon:"calendar",color:"var(--warning)"},
  {id:"eccedenza",label:"Ore eccedenti",icon:"trending",color:"var(--warning)"},
  {id:"durata",label:"Durata non corrispondente",icon:"clipboard",color:"var(--info)"},
  {id:"orfano",label:"Slot orfani",icon:"alert",color:"var(--warning)"},
  {id:"weekend",label:"Slot nel weekend",icon:"sun",color:"var(--info)"},
  {id:"tutor_senza_slot",label:"Tutor senza slot",icon:"user",color:"var(--info)"},
  {id:"corso_senza_sessioni",label:"Corso senza sessioni",icon:"briefcase",color:"var(--info)"},
  {id:"giornata_lunga",label:"Giornata >8h",icon:"alert",color:"var(--warning)"},
];
const DRAG_PX=5,DRAG_MS=150;
let _dragDone=false;
function markDrag(){_dragDone=true;setTimeout(()=>{_dragDone=false;},50);}
function wasDrag(){return _dragDone;}

const NAV_GROUPS=[
  {group:"Calendario",items:[
    {id:"calendar",label:"Calendari",icon:"calendar"},
  ]},
  {group:"Anagrafiche",items:[
    {id:"ana-tutors",label:"Anagrafica Tutor",icon:"users"},
    {id:"ana-corsi",label:"Anagrafica Corsi",icon:"graduationCap"},
    {id:"ana-avvisi",label:"Anagrafica Avvisi/Progetti",icon:"briefcase"},
  ]},
  {group:"Strumenti",items:[
    {id:"ai",label:"AI Import",icon:"sparkles"},
    {id:"insights",label:"Insights",icon:"barchart"},
    {id:"verifica",label:"Verifica coerenza",icon:"shieldCheck"},
  ]},
  {group:"Sistema",items:[
    {id:"settings",label:"Impostazioni",icon:"settings"},
  ]},
];

// ── UTILS ─────────────────────────────────────────────────────────────────
function darkenHex(hex,pct){if(!hex||!hex.startsWith("#"))return hex;const r=Math.max(0,Math.round(parseInt(hex.slice(1,3),16)*(1-pct)));const g=Math.max(0,Math.round(parseInt(hex.slice(3,5),16)*(1-pct)));const b=Math.max(0,Math.round(parseInt(hex.slice(5,7),16)*(1-pct)));return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;}
function lightenHex(hex,pct){if(!hex||!hex.startsWith("#"))return hex;const r=Math.min(255,Math.round(parseInt(hex.slice(1,3),16)+(255-parseInt(hex.slice(1,3),16))*pct));const g=Math.min(255,Math.round(parseInt(hex.slice(3,5),16)+(255-parseInt(hex.slice(3,5),16))*pct));const b=Math.min(255,Math.round(parseInt(hex.slice(5,7),16)+(255-parseInt(hex.slice(5,7),16))*pct));return`#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;}
function hexToRgba(hex,a){if(!hex||!hex.startsWith("#"))return`rgba(79,134,198,${a})`;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}
function fmt(h){return`${String(Math.floor(h)).padStart(2,"0")}:${String(Math.round((h%1)*60)).padStart(2,"0")}`;}
function fmtDurata(ore){if(!ore||ore<=0)return"";const h=Math.floor(ore),m=Math.round((ore-h)*60);return m===0?`${h}h`:`${h}:${String(m).padStart(2,"0")}`;}
function timeStrToH(s){const[hh,mm]=s.split(":").map(Number);return hh+(mm||0)/60;}
function hToTimeStr(h){const hh=Math.floor(h),mm=Math.round((h-hh)*60);return`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;}
function snapH(h){return Math.round(h*4)/4;}
function isWeekday(year,month,day){const d=new Date(year,month,day).getDay();return d!==0&&d!==6;}
function fmtTs(d){if(!d||!(d instanceof Date)||isNaN(d))return"—";const p=n=>String(n).padStart(2,"0");return`${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function fo(o){return o%1===0?`${o}h`:`${o.toFixed(1)}h`;}
function fmtOreMin(ore){const h=Math.floor(ore);const m=Math.round((ore-h)*60);if(m===0)return`${h}h`;return`${h}h ${m}min`;}
function fmtDayMonth(day,monthKey){const m=MONTHS.find(x=>x.key===monthKey);if(!m)return`${day} ${monthKey}`;return`${day} ${MONTH_ABBR_IT[m.month]}-${String(m.year).slice(2)}`;}
function fmtPct(ore,totale){if(!totale||totale===0)return"—";return(ore/totale*100).toFixed(2)+"%";}
function sortMK(keys){return[...keys].sort((a,b)=>MONTHS.findIndex(m=>m.key===a)-MONTHS.findIndex(m=>m.key===b));}
function looksLikeCalendar(text){return[/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/,/\b\d{1,2}:\d{2}\b/,/\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/i].some(p=>p.test(text));}
function layoutEvents(evs){
  const sorted=[...evs].sort((a,b)=>a.start-b.start);const cols=[];
  const res=sorted.map(ev=>{for(let c=0;c<cols.length;c++)if(cols[c].end<=ev.start){cols[c]={end:ev.end};return{ev,col:c};}cols.push({end:ev.end});return{ev,col:cols.length-1};});
  return res.map(({ev,col})=>({ev,col,numCols:cols.length}));
}
function cleanObj(obj){if(Array.isArray(obj))return obj.map(cleanObj);if(obj&&typeof obj==="object"){const o={};for(const[k,v]of Object.entries(obj)){if(typeof v!=="function"&&!k.startsWith("_"))o[k]=cleanObj(v);}return o;}return obj;}
function makeJSONBlob(corsi,tutors,tutEvents,anagraficaCorsi,avvisi,settings,userProfiles,authorizedEmails,activityLog){return JSON.stringify({version:6,exportedAt:new Date().toISOString(),anagraficaCorsi,corsi,avvisi,tutors,tutEvents,settings,userProfiles,authorizedEmails,activityLog},null,2);}

// ── FIRESTORE ─────────────────────────────────────────────────────────────
async function fsLoad(){try{const[co,tu,te,se,an,av]=await Promise.all([db.collection("corsi").get(),db.collection("tutors").get(),db.collection("tutEvents").get(),db.collection("settings").doc("app").get(),db.collection("anagraficaCorsi").get(),db.collection("avvisi_progetti").get()]);const te2={};te.docs.forEach(d=>{te2[d.id]=d.data();});return{corsi:co.docs.map(d=>d.data()),tutors:tu.docs.map(d=>d.data()),tutEvents:te2,settings:se.exists?se.data():{},anagraficaCorsi:an.docs.map(d=>d.data()),avvisi:av.docs.map(d=>d.data())};}catch(e){console.error(e);return{corsi:[],tutors:[],tutEvents:{},settings:{},anagraficaCorsi:[],avvisi:[]};}}
async function fsSaveCorsi(list){showSaving();const b=db.batch();const s=await db.collection("corsi").get();s.docs.forEach(d=>b.delete(d.ref));list.forEach(x=>b.set(db.collection("corsi").doc(x.id),cleanObj(x)));await b.commit();}
async function fsSaveTutors(list){showSaving();const b=db.batch();const s=await db.collection("tutors").get();s.docs.forEach(d=>b.delete(d.ref));list.forEach(x=>b.set(db.collection("tutors").doc(x.id),cleanObj(x)));await b.commit();}
async function fsSaveTutEvents(tId,mk,evs){showSaving();await db.collection("tutEvents").doc(tId).set({[mk]:cleanObj(evs)},{merge:true});}
async function fsSaveSettings(s){await db.collection("settings").doc("app").set(s,{merge:true});}
async function fsSaveAnaCorsi(list){showSaving();const b=db.batch();const s=await db.collection("anagraficaCorsi").get();s.docs.forEach(d=>b.delete(d.ref));list.forEach(x=>b.set(db.collection("anagraficaCorsi").doc(x.id),cleanObj(x)));await b.commit();}
async function fsSaveAvvisi(list){showSaving();const b=db.batch();const s=await db.collection("avvisi_progetti").get();s.docs.forEach(d=>b.delete(d.ref));list.forEach(x=>b.set(db.collection("avvisi_progetti").doc(x.id),cleanObj(x)));await b.commit();}
// Targeted single-document writes
async function fsSaveCorso(co){showSaving();await db.collection("corsi").doc(co.id).set(cleanObj(co));}
async function fsDeleteCorso(id){showSaving();await db.collection("corsi").doc(id).delete();}
async function fsSaveTutorDoc(t){showSaving();await db.collection("tutors").doc(t.id).set(cleanObj(t));}
async function fsDeleteTutorDoc(id){showSaving();await db.collection("tutors").doc(id).delete();}
async function fsDeleteTutEventsDoc(id){showSaving();await db.collection("tutEvents").doc(id).delete();}
async function fsSaveAnaCorsoDoc(a){showSaving();await db.collection("anagraficaCorsi").doc(a.id).set(cleanObj(a));}
async function fsDeleteAnaCorsoDoc(id){showSaving();await db.collection("anagraficaCorsi").doc(id).delete();}
async function fsSaveAvviso(av){showSaving();await db.collection("avvisi_progetti").doc(av.id).set(cleanObj(av));}
async function fsDeleteAvviso(id){showSaving();await db.collection("avvisi_progetti").doc(id).delete();}
async function fsClearAll(){showSaving();for(const c of["corsi","tutors","tutEvents","settings","anagraficaCorsi","avvisi_progetti","userProfiles"]){const s=await db.collection(c).get();const b=db.batch();s.docs.forEach(d=>b.delete(d.ref));await b.commit();}}
function fmtDateIT(mk,day){const m=MONTHS.find(x=>x.key===mk);if(!m)return`${day} ${mk}`;return`${day} ${MONTH_ABBR_IT[m.month]} ${m.year}`;}
function fmtSlotRange(start,end){return`${fmt(start)}–${fmt(end)} (${fmtDurata(end-start)})`;}
// Build a [{label,from,to}] diff between two slot states. mk/mkNew = month keys.
function diffSlotChanges(old,upd,{tutorOld,tutorNew,mk,mkNew}={}){
  const ch=[];
  if(upd.name!==undefined&&upd.name!==old.name)ch.push({label:"Corso",from:old.name||"—",to:upd.name||"—"});
  if(tutorOld!==undefined&&tutorNew!==undefined&&tutorOld!==tutorNew)ch.push({label:"Tutor",from:tutorOld||"—",to:tutorNew||"—"});
  const oldDay=old.day,newDay=upd.day!==undefined?upd.day:old.day;
  const oldMk=mk,newMk=mkNew||mk;
  if(oldDay!==newDay||oldMk!==newMk)ch.push({label:"Giorno",from:fmtDateIT(oldMk,oldDay),to:fmtDateIT(newMk,newDay)});
  const oS=old.start,oE=old.end,nS=upd.start!==undefined?upd.start:old.start,nE=upd.end!==undefined?upd.end:old.end;
  if(oS!==nS||oE!==nE)ch.push({label:"Orario",from:fmtSlotRange(oS,oE),to:fmtSlotRange(nS,nE)});
  return ch;
}
async function fsLog(userEmail,type,detail,changes){try{const doc={userEmail,type,detail,timestamp:firebase.firestore.FieldValue.serverTimestamp()};if(changes&&changes.length>0)doc.changes=changes;await db.collection("activityLog").add(doc);}catch(e){console.error(e);}}
async function fsLoadLog(){try{const s=await db.collection("activityLog").orderBy("timestamp","desc").limit(500).get();return s.docs.map(d=>{const x=d.data();return{...x,id:d.id,ts:x.timestamp?.toDate()||new Date(0)};});}catch(e){return[];}}
async function fsCreateBackup(corsi,tutors,tutEvents,anagraficaCorsi,avvisi,settings){let userProfiles={},authorizedEmails={},activityLog=[];try{const s=await db.collection("activityLog").orderBy("timestamp","desc").limit(500).get();activityLog=s.docs.map(d=>({...d.data(),id:d.id}));}catch(e){}try{const s=await db.collection("userProfiles").get();s.docs.forEach(d=>{userProfiles[d.id]=d.data();});}catch(e){}try{const s=await db.collection("authorizedEmails").get();s.docs.forEach(d=>{authorizedEmails[d.id]=d.data();});}catch(e){}const json=makeJSONBlob(corsi,tutors,tutEvents,anagraficaCorsi,avvisi,settings||{},userProfiles,authorizedEmails,activityLog);const size=new Blob([json]).size;const ref=await db.collection("backups").add({createdAt:firebase.firestore.FieldValue.serverTimestamp(),data:json,size,version:6});return ref.id;}
async function fsListBackups(){try{const s=await db.collection("backups").orderBy("createdAt","desc").get();return s.docs.map(d=>({id:d.id,size:d.data().size||0,created:d.data().createdAt?.toDate()||new Date(0),data:d.data().data}));}catch(e){return[];}}
async function fsDeleteBackup(id){await db.collection("backups").doc(id).delete();}
async function fsApplyBackupPolicy(backups){const sorted=[...backups].sort((a,b)=>b.created-a.created);const toDelete=sorted.slice(10);for(const b of toDelete)try{await fsDeleteBackup(b.id);}catch(e){}}
const DEFAULT_ROLE_PERMS={viewer:{addSlot:false,editSlot:false,deleteSlot:false,editVerified:false,verifySlot:false,useAiImport:false,useInsights:false,useVerifica:false,editAnagrafica:false,viewLog:false,viewBackup:false,editSettings:false,manageDemo:false},user:{addSlot:true,editSlot:true,deleteSlot:true,editVerified:false,verifySlot:false,useAiImport:true,useInsights:true,useVerifica:true,editAnagrafica:true,viewLog:true,viewBackup:true,editSettings:false,manageDemo:false},admin:{addSlot:true,editSlot:true,deleteSlot:true,editVerified:true,verifySlot:true,useAiImport:true,useInsights:true,useVerifica:true,editAnagrafica:true,viewLog:true,viewBackup:true,editSettings:true,manageDemo:true}};
const ALL_PERMS={addSlot:true,editSlot:true,deleteSlot:true,editVerified:true,verifySlot:true,useAiImport:true,useInsights:true,useVerifica:true,editAnagrafica:true,viewLog:true,viewBackup:true,editSettings:true,manageDemo:true};
